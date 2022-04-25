// Disable these because unicorn is stupid
/* eslint-disable unicorn/no-array-callback-reference */
/* eslint-disable unicorn/no-array-method-this-argument */
import * as mongodb from "mongodb";
import { Except } from "type-fest";

import { Cache, CacheOptions } from "../Cache";
import * as database from "./index";

export interface DatabaseCacheOptions<KeyName> extends CacheOptions {
    indexName: KeyName;
}

// could be ? Type | U : Type, but unsure about the mongodb implementation,
// so just keep it ? U : Type, as it fits my usecases
export type CacheFilterCondition<Type> =
    Type extends ReadonlyArray<infer U> ? U : Type;

export type CacheFilter<T> =
    & {
        [K in keyof T]?: CacheFilterCondition<T[K]>;
    }
    & Partial<{
        $or: CacheFilter<T>[]
    }>;

/**
 * A MongoDB request cacher for the most important functions
 */
export default class DatabaseCache<
    TSchema extends mongodb.Document,
    KeyName extends keyof mongodb.WithId<TSchema> = keyof mongodb.WithId<TSchema>,
    KeyType = mongodb.WithId<TSchema>[KeyName],
> {
    public readonly cache: Cache<KeyType, mongodb.WithId<TSchema>>;
    public readonly collection_name: string;
    public readonly index_name: KeyName;

    public get collection(): mongodb.Collection<TSchema> {
        return database.collection<TSchema>(this.collection_name);
    }

    constructor(collection_name: string, opts: DatabaseCacheOptions<KeyName>) {
        this.cache = new Cache(opts);
        this.collection_name = collection_name;
        this.index_name = opts.indexName;
    }

    private _filter(item: mongodb.WithId<TSchema>, filter: CacheFilter<TSchema>): boolean {
        const requirements: boolean[] = [];

        const filter_keys = Object.keys(filter).filter(key => !/^\$/g.test(key));
        if (filter_keys.length > 0) {
            requirements.push(
                filter_keys.every(key => {
                    return Array.isArray(item[key])
                        ? item[key].includes(filter[key])
                        : item[key] === filter[key];
                }),
            );
        } else {
            requirements.push(true);
        }

        if (filter.$or) {
            requirements.push(
                filter.$or.some(sub_filter => this._filter(item, sub_filter)),
            );
        }

        return requirements.every(Boolean);
    }

    private _findOne(filter: CacheFilter<mongodb.WithId<TSchema>>): mongodb.WithId<TSchema> | undefined {
        // find documents quicker if filter includes index key
        if (typeof filter[this.index_name] !== "undefined") {
            const return_val = this.cache.get(filter[this.index_name] as KeyType);
            if (return_val) {
                // it was found in cache! does it match the rest of the filters?
                if (this._filter(return_val, filter)) return return_val;
                // else directly return, because since this was an indexed field search,
                // the answer won't be in other parts of the cache
                return;
            }
        }

        return this.cache.findOne(item => {
            return this._filter(item, filter);
        });
    }

    private _findMany(filter: CacheFilter<mongodb.WithId<TSchema>>): mongodb.WithId<TSchema>[] {
        // find documents quicker if filter includes index key
        if (typeof filter[this.index_name] !== "undefined") {
            const return_val = this.cache.get(filter[this.index_name] as KeyType);
            if (return_val) {
                // it was found in cache! does it match the rest of the filters?
                if (this._filter(return_val, filter)) return [return_val];
                // else directly return, because since this was an indexed field search,
                // the answer won't be in other parts of the cache
                return [];
            }
        }

        return this.cache.findMany(item => {
            return this._filter(item, filter);
        });
    }

    /* PUBLIC METHODS */

    async findOne(filter: CacheFilter<mongodb.WithId<TSchema>>): Promise<mongodb.WithId<TSchema> | undefined> {
        let doc: mongodb.WithId<TSchema> | undefined;

        doc = this._findOne(filter);
        if (doc) return doc;

        doc = await this.collection.findOne(filter) ?? undefined;
        if (!doc) return;

        this.cache.set(doc[this.index_name], doc);

        return doc;
    }

    async findMany(
        filter: mongodb.Filter<TSchema>,
        options?: mongodb.FindOptions<TSchema>,
    ): Promise<mongodb.WithId<TSchema>[]> {
        const docs = await this.collection.find(filter, options).toArray();

        for (const doc of docs) {
            this.cache.set(doc[this.index_name], doc);
        }

        return docs;
    }

    async insertOne(doc: mongodb.OptionalUnlessRequiredId<TSchema>): Promise<mongodb.WithId<TSchema>> {
        const insert_return = await this.collection.insertOne(doc);

        // To ensure semantic correctness, add _id field to inserted document with the
        // id the server used
        const inserted_doc = {
            ...doc,
            _id: insert_return.insertedId,
        } as mongodb.WithId<TSchema>;

        this.cache.set(inserted_doc[this.index_name], inserted_doc);

        return inserted_doc;
    }

    // async insertMany();

    async updateOne(
        filter: CacheFilter<TSchema>,
        update: mongodb.UpdateFilter<TSchema>,
        opts?: Except<mongodb.FindOneAndUpdateOptions, "returnDocument">,
    ): Promise<mongodb.WithId<TSchema> | undefined> {
        // delete items from cache first, because if mongodb fails halfway through and
        // some of the data is already mutated, the cache is poisoned and will
        // return old results
        const doc = this._findOne(filter);
        if (doc) this.cache.delete(doc[this.index_name]);

        const result = await this.collection.findOneAndUpdate(
            filter,
            update,
            { ...opts, returnDocument: "after" },
        );

        if (result.value) {
            this.cache.set(result.value[this.index_name], result.value);
            return result.value;
        }
    }

    async updateMany(
        filter: CacheFilter<TSchema>,
        update: mongodb.UpdateFilter<TSchema>,
        opts: mongodb.UpdateOptions = {},
    ): Promise<void> {
        // delete items from cache first, because if mongodb fails halfway through and
        // some of the data is already mutated, the cache is poisoned and will
        // return old results
        const docs = this._findMany(filter);
        for (const doc of docs) {
            this.cache.delete(doc[this.index_name]);
        }

        await this.collection.updateMany(
            filter,
            update,
            opts,
        );
    }

    async replaceOne(filter: CacheFilter<TSchema>, replacement: mongodb.WithoutId<TSchema>, opts: mongodb.FindOneAndReplaceOptions = {}): Promise<mongodb.WithId<TSchema> | undefined> {
        // delete items from cache first, because if mongodb fails halfway through and
        // some of the data is already mutated, the cache turns poisoned and will
        // return old results
        const doc = this._findOne(filter);
        if (doc) this.cache.delete(doc[this.index_name]);

        const result = await this.collection.findOneAndReplace(
            filter,
            replacement,
            { ...opts, returnDocument: "after" },
        );

        if (result.value) {
            this.cache.set(result.value[this.index_name], result.value);
            return result.value;
        }
    }

    async deleteOne(filter: CacheFilter<TSchema>): Promise<void> {
        const doc = this._findOne(filter);
        if (doc) this.cache.delete(doc[this.index_name]);

        await this.collection.deleteOne(filter);
    }

    async deleteMany(filter: CacheFilter<TSchema>): Promise<void> {
        // delete items from cache first, because if mongodb fails halfway through and
        // some of the data is already mutated, the cache is poisoned and will
        // return old results
        const docs = this._findMany(filter);
        for (const doc of docs) {
            this.cache.delete(doc[this.index_name]);
        }

        await this.collection.deleteMany(filter);
    }

    async count(filter: mongodb.Filter<TSchema>): Promise<number> {
        return await this.collection.countDocuments(filter);
    }

    async estimatedCount(): Promise<number> {
        return await this.collection.estimatedDocumentCount();
    }
}

import { Collection, Document, Filter, FindCursor, FindOneAndReplaceOptions, FindOneAndUpdateOptions, FindOptions, OptionalId, UpdateFilter } from "mongodb";
import { Except } from "type-fest";
import Cache, { CacheOptions } from "./Cache";
import database from "./database";

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
    TSchema extends Document,
    KeyName extends keyof TSchema = keyof TSchema,
    KeyType = TSchema[KeyName],
> {
    public readonly cache: Cache<KeyType, TSchema>;
    public readonly collection_name: string;
    public readonly index_name: KeyName;

    public get collection(): Collection<TSchema> {
        return database.collection<TSchema>(this.collection_name);
    }

    constructor(collection_name: string, opts: DatabaseCacheOptions<KeyName>) {
        this.cache = new Cache(opts);
        this.collection_name = collection_name;
        this.index_name = opts.indexName;
    }

    private _filter(item: TSchema, filter: CacheFilter<TSchema>): boolean {
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

        return requirements.every(a => a);
    }

    private _findOne(filter: CacheFilter<TSchema>): TSchema | undefined {
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

        return this.cache.find(item => {
            return this._filter(item, filter);
        });
    }

    // publics

    async findOne(filter: CacheFilter<TSchema>): Promise<TSchema | undefined> {
        let doc: TSchema | undefined;

        doc = this._findOne(filter);
        if (doc) return doc;

        doc = await this.collection.findOne(filter);
        if (!doc) return;

        this.cache.set(doc[this.index_name], doc);

        return doc;
    }

    async findMany(filter: Filter<TSchema>, cursor_func?: (cursor: FindCursor<TSchema>) => void, options?: FindOptions<TSchema>): Promise<TSchema[]> {
        const cursor = this.collection.find(filter, options);
        if (cursor_func) cursor_func(cursor);
        const docs = await cursor.toArray();

        for (const doc of docs) {
            this.cache.set(doc[this.index_name], doc);
        }

        return docs;
    }

    async insertOne(doc: TSchema): Promise<TSchema> {
        await this.collection.insertOne(doc as OptionalId<TSchema>);

        this.cache.set(doc[this.index_name], doc);

        return doc;
    }

    // async insertMany();

    async updateOne(filter: CacheFilter<TSchema>, update: UpdateFilter<TSchema>, opts?: Except<FindOneAndUpdateOptions, "returnDocument">): Promise<TSchema | undefined> {
        const result = await this.collection.findOneAndUpdate(
            filter,
            update,
            { ...opts, returnDocument: "after" },
        );

        if (result.value) {
            this.cache.set(result.value[this.index_name], result.value);
            return result.value;
        }

        // if for a reason it didn't return a value, which
        // should mostly be because this document doesn't
        // exist in the collection, but we can't be sure,
        // then delete it from cache, so there aren't any confusions
        const doc = this._findOne(filter);
        if (doc) this.cache.delete(doc[this.index_name]);
    }

    async replaceOne(filter: CacheFilter<TSchema>, replacement: TSchema, opts: FindOneAndReplaceOptions = {}): Promise<TSchema | undefined> {
        const result = await this.collection.findOneAndReplace(
            filter,
            replacement,
            { ...opts, returnDocument: "after" },
        );

        if (result.value) {
            this.cache.set(result.value[this.index_name], result.value);
            return result.value;
        }

        // if for a reason it didn't return a value, which
        // should mostly be because this document doesn't
        // exist in the collection, but we can't be sure,
        // then delete it from cache, so there aren't any confusions
        const doc = this._findOne(filter);
        if (doc) this.cache.delete(doc[this.index_name]);
    }

    // async updateMany();

    async deleteOne(filter: CacheFilter<TSchema>): Promise<void> {
        const doc = this._findOne(filter);
        if (doc) this.cache.delete(doc[this.index_name]);

        await this.collection.deleteOne(filter);
    }

    // async deleteMany();

    count(filter: Filter<TSchema>): Promise<number> {
        return this.collection.countDocuments(filter);
    }

    estimatedCount(): Promise<number> {
        return this.collection.estimatedDocumentCount();
    }
}

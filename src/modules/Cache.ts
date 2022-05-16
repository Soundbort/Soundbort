export interface CacheOptions {
    /**
     * maximum age of cache entries in seconds
     */
    ttl?: number;
    /**
     * maximum number of cache entries
     */
    maxSize?: number;
}

export const DEFAULTS: Required<CacheOptions> = {
    maxSize: 0,
    ttl: 0,
};

export class Cache<K, T> extends Map<K, T> {
    public readonly ttl: number;
    public readonly maxSize: number;

    private _ttl: Map<K, NodeJS.Timeout> = new Map();

    constructor(opts: CacheOptions = {}) {
        super();

        this.ttl = (opts.ttl ?? DEFAULTS.ttl) * 1000;
        this.maxSize = opts.maxSize ?? DEFAULTS.maxSize;
    }

    private _setTTLTimeout(key: K) {
        if (this.ttl <= 0) return;

        const old_timeout = this._ttl.get(key);
        if (typeof old_timeout !== "undefined") clearTimeout(old_timeout);

        const timeout = setTimeout(() => this.delete(key), this.ttl);
        this._ttl.set(key, timeout);
    }

    clear(): void {
        super.clear();

        for (const [key] of this._ttl) {
            const old_timeout = this._ttl.get(key);
            if (typeof old_timeout !== "undefined") {
                clearTimeout(old_timeout);
            }
        }
        this._ttl.clear();
    }

    delete(key: K): boolean {
        super.delete(key);

        const old_timeout = this._ttl.get(key);
        if (typeof old_timeout !== "undefined") {
            clearTimeout(old_timeout);
            this._ttl.delete(key);
        }

        return true;
    }

    get(key: K): T | undefined {
        const doc = super.get(key);
        if (!doc) return;

        this._setTTLTimeout(key);

        return doc;
    }

    findOne(finder: (item: T, key: K) => boolean): T | undefined {
        for (const [key, item] of this) {
            if (finder(item, key)) {
                this._setTTLTimeout(key);
                return item;
            }
        }
    }

    findMany(finder: (item: T, key: K) => boolean): T[] {
        const results: T[] = [];
        for (const [key, item] of this) {
            if (finder(item, key)) {
                this._setTTLTimeout(key);
                results.push(item);
            }
        }
        return results;
    }

    has(key: K): boolean {
        this._setTTLTimeout(key);

        if (super.has(key)) return true;

        return false;
    }

    set(key: K, new_doc: T): this {
        if (this.maxSize > 0 && this.size >= this.maxSize) {
            const first_key = this.keys().next();
            if (!first_key.done) {
                this.delete(first_key.value);
            }
        }

        super.set(key, new_doc);
        this._setTTLTimeout(key);

        return this;
    }
}

/**
 * Little Cache extension to cache buffers and set a maximum
 * cache size in bytes
 */

import { Cache, CacheOptions, DEFAULTS as CacheDEFAULTS } from "./Cache";

export interface BufferCacheOptions extends CacheOptions {
    /**
     * maximum cache size in bytes. 0 for no limit
     */
    maxByteSize?: number;
}

export const DEFAULTS: Required<BufferCacheOptions> = {
    ...CacheDEFAULTS,
    maxByteSize: 0,
};

export class BufferCache<K> extends Cache<K, Buffer> {
    public readonly maxByteSize: number;

    private _byteSize: number = 0;
    public get byteSize(): number {
        return this._byteSize;
    }

    constructor(opts: BufferCacheOptions = {}) {
        super(opts);

        this.maxByteSize = opts.maxByteSize ?? DEFAULTS.maxByteSize;
    }

    clear(): void {
        super.clear();

        this._byteSize = 0;
    }

    delete(key: K): boolean {
        const buffer = this.get(key);
        if (buffer) {
            this._byteSize -= buffer.byteLength;
        }

        return super.delete(key);
    }

    set(key: K, buffer: Buffer): this {
        if (this.maxByteSize > 0) {
            // delete entries until the new element can be stored in the map
            for (const key of this.keys()) {
                if (this._byteSize + buffer.byteLength <= this.maxByteSize) break;

                this.delete(key);
            }
        }

        this._byteSize += buffer.byteLength;

        return super.set(key, buffer);
    }
}

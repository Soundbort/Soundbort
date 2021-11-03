import { Collection, Document } from "mongodb";
import * as database from "./index.js";

// A lot of typescript cheating to make this proxy wrap
// around the db client getter from database/index.ts

export default function databaseProxy<
    TSchema extends Document
>(collection_name: string): Collection<TSchema> {
    return new Proxy<Collection<TSchema>>({} as Collection<TSchema>, {
        get(target, handler) {
            return (database.collection<TSchema>(collection_name) as any)[handler];
        },
    });
}

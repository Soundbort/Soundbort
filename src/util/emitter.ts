import { Awaited } from "discord.js";
import EventEmitter from "events";

export type GenericListener<T extends any[]> = (...args: T) => Awaited<void>;
type EventMap = Record<string, GenericListener<any[]>>;

type EventKey<T extends EventMap> = string & keyof T;

export class TypedEventEmitter<Events extends EventMap> {
    private _emitter = new EventEmitter();

    on<K extends EventKey<Events>>(event: K, listener: Events[K]): this {
        this._emitter.on(event, listener);
        return this;
    }
    once<K extends EventKey<Events>>(event: K, listener: Events[K]): this {
        this._emitter.once(event, listener);
        return this;
    }
    off<K extends EventKey<Events>>(event: K, listener: Events[K]): this {
        this._emitter.off(event, listener);
        return this;
    }
    emit<K extends EventKey<Events>>(event: K, ...args: Parameters<Events[K]>): boolean {
        return this._emitter.emit(event, ...args);
    }
}

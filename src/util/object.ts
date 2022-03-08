/**
 * Excludes a property from an object
 */
export function omitProp<T extends object, K extends keyof T>(obj: T, prop: K): Omit<T, K> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [prop]: _, ...rest } = obj;
    return rest;
}

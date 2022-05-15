export function lastItem<T>(arr: T[]): T {
    return arr[arr.length - 1];
}

export function findAndRemove<T>(arr: T[], elem: T): void {
    const i = arr.indexOf(elem);
    if (i > -1) arr.splice(i, 1);
}

export function findFirstIndex<T>(arr: T[], finder: (item: T) => boolean): number {
    for (const [i, element] of arr.entries()) {
        if (finder(element)) return i;
    }
    return arr.length;
}

export function removeDupes<T>(arr: T[]): T[] {
    return [...new Set(arr)];
}

export function lastItem<T>(arr: T[]): T {
    return arr[arr.length - 1];
}

export function findAndRemove<T>(arr: T[], elem: T): void {
    const i = arr.indexOf(elem);
    if (i > -1) arr.splice(i, 1);
}

export function findFirstIndex<T>(arr: T[], finder: (item: T) => boolean): number {
    for (let i = 0; i < arr.length; i++) {
        if (finder(arr[i])) return i;
    }
    return arr.length;
}

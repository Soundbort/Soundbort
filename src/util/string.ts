export function formatEllipsis(base: string, insert: string, length: number) {
    const leftover_length = length - base.length + 1;
    if (insert.length > leftover_length) {
        insert = insert.slice(0, Math.max(0, leftover_length - 3)) + "...";
    }
    return base.replace("%", insert);
}

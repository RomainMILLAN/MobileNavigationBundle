/**
 * Indexes of the section headers to hide: those repeating the previous one. This happens
 * when "Load more" appends a page that continues the same month.
 */
export function dedupeSectionHeaders(keys: ReadonlyArray<string>): number[] {
    const duplicates: number[] = [];
    keys.forEach((key, index) => {
        if (index > 0 && key === keys[index - 1]) {
            duplicates.push(index);
        }
    });

    return duplicates;
}

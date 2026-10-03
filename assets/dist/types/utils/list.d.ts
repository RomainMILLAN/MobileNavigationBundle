/**
 * Indexes of the section headers to hide: those repeating the previous one. This happens
 * when "Load more" appends a page that continues the same month.
 */
export declare function dedupeSectionHeaders(keys: ReadonlyArray<string>): number[];

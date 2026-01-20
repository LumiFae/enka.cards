import { CacheOptions } from "./types/general";

const pendingRenders = new Map<string, Promise<Uint8Array | null | undefined>>();

/**
 * Wrap a card rendering promise to deduplicate it.
 * @param key The unique key for the card request.
 * @param res The promise to wrap.
 * @returns The deduplicated promise.
 */
export function dedupe(key: string, fn: () => Promise<Uint8Array | null | undefined>) {
    const existing = pendingRenders.get(key);
    console.log("existing?", !!existing);
    if (existing) return existing;

    // Use Promise.resolve to catch synchronous errors.
    const res = Promise.resolve().then(fn);
    pendingRenders.set(key, res);
    res.finally(() => pendingRenders.delete(key));
    return res;
}

/**
 * Generate a unique key for a card request for deduplication.
 * @param url The URL to get the card from.
 * @param locale The locale to parse into Enka.
 * @param cacheOptions The cache options.
 * @param index The character index in the case of UID lookups
 * @returns The unique key.
 */
export function makeCardKey(
    url: string,
    locale: string,
    cache: CacheOptions,
    index?: number,
) {
    return [
        url,
        locale,
        index ?? "-",
        cache.substats ? "1" : "0",
        cache.subsBreakdown ? "1" : "0",
        cache.uid ? "1" : "0",
        cache.hideNames ? "1" : "0",
    ].join("|");
}

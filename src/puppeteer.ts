import puppeteer, { Browser, BrowserContext } from "puppeteer";
import { CacheOptions, CachedResponse } from "./types/general";
import ContextPool from "./context-pool";
import { makeCardKey, dedupe } from "./deduplication";

const responseCache = new Map<string, CachedResponse>();

let browser: Browser | null = null;

export const getBrowser = async () =>
(browser ??= await puppeteer.launch({
    args: [
        "--no-sandbox",
        "--font-render-hinting=medium",
        "--force-color-profile=srgb",
        "--disable-web-security",
        "--disable-setuid-sandbox",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
    ],
}));

const generateGlobalToggles = (options: CacheOptions) => ({
    dark: false,
    saveImageToServer: false,
    userContent: true,
    adaptiveColor: false,
    profileCategory: 0,
    hoyo_type: 0,
    ...options,
});

/**
 * Gets the card from Puppeteer.
 * @param url The URL to get the card from.
 * @param locale The locale to parse into Enka.
 * @param cacheOptions The cache options.
 * @param index The character index in the case of UID lookups
 * @returns The card if found, null if 404, and undefined if anything else.
 */
export const getNewCard = async (
    url: string,
    locale: string,
    cacheOptions: CacheOptions,
    index?: number
) => {
    let context: BrowserContext | null = null;
    try {
        console.time("getCard");
        context = await ContextPool.get();
        const page = await context.newPage();

        await Promise.all([
            page.setRequestInterception(true),
            page.setUserAgent({
                userAgent:
                    "Mozilla/5.0 (compatible; enka.cards/1.0; +https://cards.enka.network)",
            }),
            page.setViewport({ width: 1920, height: 1080 }),
            context.setCookie(
                {
                    name: "locale",
                    value: locale,
                    domain: "enka.network",
                    path: "/",
                    expires: -1,
                },
                {
                    name: "globalToggles",
                    value: btoa(
                        JSON.stringify(generateGlobalToggles(cacheOptions))
                    ),
                    domain: "enka.network",
                    path: "/",
                    expires: -1,
                }
            ),
        ]);

        page.on("request", (event) => {
            const url = new URL(event.url());

            const cached = responseCache.get(url.href);
            if (cached && cached.expires > Date.now())
                return event.respond({
                    status: cached.status,
                    headers: cached.headers,
                    body: cached.body,
                });

            if (
                url.pathname.startsWith("/img/") &&
                !url.pathname.includes("UI_Gacha_AvtarImg") &&
                !url.pathname.includes("overlay.jpg") &&
                !url.pathname.includes("zzz_bg.jpg") &&
                !url.pathname.includes("hsr_bg.jpg") &&
                !url.pathname.includes("const-bg.png") &&
                !url.pathname.includes("hsrdashed.svg")
            )
                event.abort();
            else if (url.host === "api.enka.network") event.abort();
            else if (
                url.pathname.startsWith("/ui/hsr/SpriteOutput/AvatarRoundIcon/")
            )
                event.abort();
            else if (
                url.pathname.startsWith("/ui/zzz/IconInterKnotRole") ||
                url.pathname.startsWith("/ui/zzz/Tower") ||
                url.pathname.startsWith("/ui/zzz/Assault") ||
                url.pathname.startsWith("/ui/zzz/IconRoleCircle")
            )
                event.abort();
            else if (
                url.pathname.startsWith("/api/") &&
                !url.pathname.startsWith("/api/profile")
            )
                event.abort();
            else if (url.pathname.includes("UI_AvatarIcon")) event.abort();
            else if (
                url.host === "cdn.enka.network" &&
                !url.pathname.startsWith("/avatars/images/")
            )
                event.abort();
            else if (url.pathname.endsWith(".ico")) event.abort();
            else if (url.pathname.startsWith("/video/")) event.abort();
            else event.continue();
        });

        page.on("response", async (response) => {
            const headers = response.headers();
            const cacheControl = headers["cache-control"];
            if (!cacheControl) return;

            const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
            if (!maxAgeMatch || maxAgeMatch[1] === "0") return;

            const maxAge = parseInt(maxAgeMatch[1], 10);

            try {
                const url = new URL(response.url());
                const body = await response.buffer();
                responseCache.set(url.href, {
                    status: response.status(),
                    headers: headers,
                    body,
                    expires: Date.now() + maxAge * 1000,
                });
            } catch {
                // Can't be cached
            }
        });

        await page.goto(url);

        // In the case of redirects, i.e. the card is private/doesn't actually exist
        const removeTrailingSlash = (url: string) => url.replace(/\/+$/, "");

        if (removeTrailingSlash(page.url()) !== removeTrailingSlash(url))
            return null;

        await page.waitForFunction("document.fonts.ready");

        if (index) {
            await page.waitForSelector(
                "content>div.CharacterList>div.avatar.live"
            );
            const selector = await page
                .$$("content>div.CharacterList>div.avatar.live")
                .then((selectors) => selectors[index]);

            if (!selector) return null;

            await selector.click();
        }

        await page.waitForSelector("div.Card>div.card-host");
        await page.waitForFunction(
            '!document.querySelector("div.Card .loader")'
        );

        const html = await page.waitForSelector("div.Card");

        const img = await html?.screenshot({ type: "jpeg" });

        void page.close();

        console.timeEnd("getCard");
        return img;
    } catch (err) {
        if (err instanceof Error) {
            console.error(`Encountered an error whilst fetching card for ${url}:\nName: ${err.name}\nMessage: ${err.message}\nCause: ${err.cause}\nStack: ${err.stack}`)
        } else {
            console.error(
                `Encountered an error whilst fetching card for ${url}:\n${err}`
            );
        }
        return undefined;
    } finally {
        if (context) ContextPool.return(context);
    }
};

/**
 * Gets the card from Puppeteer. Reuses pending requests for the same card.
 * @param url The URL to get the card from.
 * @param locale The locale to parse into Enka.
 * @param cacheOptions The cache options.
 * @param index The character index in the case of UID lookups
 * @returns The card if found, null if 404, and undefined if anything else.
 */
export function getCard(
    url: string,
    locale: string,
    cacheOptions: CacheOptions,
    index?: number
) {
    const key = makeCardKey(url, locale, cacheOptions, index);
    return dedupe(key, () => getNewCard(url, locale, cacheOptions, index));
}

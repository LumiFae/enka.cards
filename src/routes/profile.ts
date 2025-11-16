import type { App } from "..";
import { getCard } from "../puppeteer";
import { CachedImage } from "../s3";
import { BaseHoyoProfile } from "../types/api";

export default (app: App) =>
    app.group("/u/:identifier/:identifier2/:characterId/:buildId", (app) =>
        app
            .derive(async ({ params, cacheOptions, status, locale }) => {
                // elysia issue fixed in 1.5, but not released
                const username = params.identifier;
                const hash = params.identifier2;
                const res = await fetch(
                    `https://enka.network/api/profile/${username}/hoyos/${hash}/?format=json`,
                    {
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (compatible; enka.cards/1.0; +https://cards.enka.network)",
                        },
                    }
                );

                if (!res.ok)
                    return status(400, "Invalid user or hash provided");

                const data = (await res.json()) as BaseHoyoProfile;

                return {
                    enkaUrl: `https://enka.network/u/${username}/${hash}/${params.characterId}/${params.buildId}`,
                    image: CachedImage.get(
                        username,
                        hash,
                        params.characterId,
                        params.buildId,
                        data.live_data_hash,
                        locale,
                        cacheOptions
                    ),
                };
            })
            .get(
                "/",
                async ({ image, locale, enkaUrl, cacheOptions, status }) => {
                    const html = image.generateHtml(locale, enkaUrl);

                    if (await image.exists()) return html;

                    const img = await getCard(enkaUrl, locale, cacheOptions);

                    if (img === null)
                        return status(404, "Failed to find card.");
                    if (!img) return status(502);

                    await image.set(img);

                    // The get url method is syncronous, so just return the original HTML.
                    return html;
                }
            )
            .get(
                "/image",
                async ({ image, locale, enkaUrl, cacheOptions, status }) => {
                    const generateResponse = (
                        buffer: ArrayBuffer | Uint8Array
                    ) =>
                        new Response(buffer as BodyInit, {
                            headers: {
                                "Content-Type": "image/jpeg",
                            },
                        });

                    if (await image.exists())
                        return generateResponse(
                            (await image.get()) as ArrayBuffer
                        );

                    const img = await getCard(enkaUrl, locale, cacheOptions);
                    
                    if (img === null)
                        return status(404, "Failed to find card.");
                    if (!img) return status(502);

                    await image.set(img);

                    return generateResponse(img);
                }
            )
    );

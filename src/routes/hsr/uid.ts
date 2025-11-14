import type { App } from "../..";
import { getCard } from "../../puppeteer";
import { CachedImage } from "../../s3";
import { HonkaiUid } from "../../types/api";

export default (app: App) =>
    app.group("/hsr/:identifier/:identifier2", (app) =>
        app
            .derive(async ({ params, cacheOptions, status }) => {
                // elysia 1.4 has an issue with params, got told will be fixed when 1.5 drops
                const uid = params.identifier;
                const characterId = params.identifier2;
                const res = await fetch(
                    `https://enka.network/api/hsr/uid/${uid}`,
                    {
                        headers: {
                            "User-Agent":
                                "Mozilla/5.0 (compatible; enka.cards/1.0; +https://cards.enka.network)",
                        },
                    }
                );

                if (!res.ok) return status(400, "Invalid UID Provided");

                const data = (await res.json()) as HonkaiUid;

                const characterIndex =
                    data.detailInfo.avatarDetailList.findIndex(
                        (x) => x.avatarId === parseInt(characterId)
                    );

                if (characterIndex === -1)
                    return status(400, "Invalid character provided");

                return {
                    enkaUrl: `https://enka.network/hsr/${uid}`,
                    image: CachedImage.getUid(
                        uid,
                        0,
                        characterId,
                        data.detailInfo.avatarDetailList[characterIndex],
                        cacheOptions
                    ),
                    characterIndex,
                };
            })
            .get(
                "/",
                async ({
                    image,
                    locale,
                    enkaUrl,
                    cacheOptions,
                    status,
                    characterIndex,
                    headers,
                    redirect,
                }) => {
                    if (
                        !headers["user-agent"] ||
                        !headers["user-agent"].includes("Discordbot")
                    )
                        return redirect(enkaUrl, 302);

                    const html = image.generateHtml(locale, enkaUrl);

                    if (await image.exists()) return html;

                    const img = await getCard(
                        enkaUrl,
                        locale,
                        cacheOptions,
                        characterIndex
                    );

                    if (!img) return status(502);

                    await image.set(img);

                    // The get url method is syncronous, so just return the original HTML.
                    return html;
                }
            )
            .get(
                "/image",
                async ({
                    image,
                    locale,
                    enkaUrl,
                    cacheOptions,
                    status,
                    characterIndex,
                }) => {
                    const generateResponse = (
                        buffer: ArrayBuffer | Uint8Array
                    ) =>
                        new Response(buffer as BodyInit, {
                            headers: {
                                "Content-Type": "image/jpeg",
                            },
                        });

                    if (await image.exists())
                        return generateResponse((await image.get())!);

                    const img = await getCard(
                        enkaUrl,
                        locale,
                        cacheOptions,
                        characterIndex
                    );

                    if (!img) return status(502);

                    await image.set(img);

                    return generateResponse(img);
                }
            )
    );

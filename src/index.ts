import { Elysia, redirect, t } from "elysia";
import { CacheOptions } from "./types/general";
import html from "@elysiajs/html";
import profile from "./routes/profile";
import { default as genshinUid } from "./routes/genshin/uid";
import { default as zenlessUid } from "./routes/zzz/uid";
import { default as honkaiUid } from "./routes/hsr/uid";

const app = new Elysia({
    systemRouter: false,
})
    .use(html())
    .get("/", () => redirect("https://enka.network", 301))
    .listen(+(process.env.PORT ?? 3000))
    .guard({
        as: "global",
        query: t.Object({
            substats: t.Optional(t.Boolean()),
            subsBreakdown: t.Optional(t.Boolean()),
            uid: t.Optional(t.Boolean()),
            hideNames: t.Optional(t.Boolean()),
            lang: t.Optional(t.String()),
        }),
    })
    .derive(({ query }) => {
        // sometimes these below values can be a string, so we have to convert
        const toBool = (bool: string | boolean) => String(bool) === "true";

        const cacheOptions: CacheOptions = {
            substats: toBool(query.substats ?? false),
            subsBreakdown: toBool(query.subsBreakdown ?? false),
            uid: toBool(query.uid ?? true),
            hideNames: toBool(query.hideNames ?? false),
        };

        return {
            cacheOptions,
            locale: query.lang ?? "en",
        };
    });

profile(app);
genshinUid(app);
honkaiUid(app);
zenlessUid(app);

export type App = typeof app;

console.log(`Started on ${process.env.PORT ?? 3000}`)
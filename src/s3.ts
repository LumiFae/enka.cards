import { S3Client, S3File } from "bun";
import { CacheOptions } from "./types/general";
import { HoyoType_T } from "./types/api";

const bucket = "enkacards";

export const client = new S3Client({
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    endpoint: process.env.S3_ENDPOINT!,
    bucket,
});

const defaultCacheOptions: CacheOptions = {
    substats: false,
    subsBreakdown: false,
    hideNames: false,
    uid: true,
};

/**
 * Used to normalise objects then stringify them, useful for {@link btoa} so that any messed up keys won't invalidate the cache.
 * @param object The object to stringify.
 * @returns The stringified object.
 */
const stringify = (object: object) =>
    JSON.stringify(object, Object.keys(object).sort());

export const generateFile = (
    username: string,
    hoyo: string,
    characterId: string | number,
    buildId: string | number,
    dataHash: number,
    locale: string,
    options: CacheOptions
) => {
    const base64 = btoa(stringify(options));
    return client.file(
        `${username}-${hoyo}-${characterId}-${buildId}-${dataHash}-${base64}.jpg`
    );
};

export const generateUidFile = (
    uid: string | number,
    type: HoyoType_T,
    characterId: string | number,
    characterData: object,
    locale: string,
    options: CacheOptions
) => {
    const base64 = btoa(stringify(options));
    const hasher = new Bun.CryptoHasher("sha256");
    hasher.update(JSON.stringify(characterData));
    // We don't want long hashes in file names really.
    const text = hasher.digest("hex").slice(0, 16);
    return client.file(`${uid}-${type}-${characterId}-${text}-${base64}.jpg`);
};

export class CachedImage {
    constructor(public file: S3File) {}

    get url() {
        return `https://${process.env.S3_ENDPOINT}/${bucket}/${this.file.name}`;
    }

    public get = async () => await this.file.arrayBuffer().catch(() => null);

    public set = async (
        value: ArrayBuffer | Buffer | Uint8Array<ArrayBufferLike>
    ) =>
        await this.file.write(value, {
            type: "image/jpeg",
            acl: "public-read",
        });

    public exists = async () => await this.file.exists();

    public generateHtml = (locale: string, enkaurl: string) => `<!DOCTYPE html>
        <html lang="${locale}">
            <head>
                <meta content="enka.cards" property="og:title" />
                <meta content="${enkaurl}" property="og:url" />
                <meta name="twitter:card" content="summary_large_image">
                <meta property="twitter:domain" content="enka.cards">
                <meta property="twitter:url" content="${enkaurl}">
                <meta name="twitter:title" content="enka.cards">
                <meta name="twitter:description" content="">
                <meta name="twitter:image" content="${
                    this.url
                }?${encodeURIComponent(crypto.randomUUID())}">
                <title>enka.cards</title>
            </head>
        </html>`;

    public static get = (
        username: string,
        hoyo: string,
        characterId: string | number,
        buildId: string | number,
        dataHash: number,
        locale: string,
        options: CacheOptions = defaultCacheOptions
    ) =>
        new CachedImage(
            generateFile(
                username,
                hoyo,
                characterId,
                buildId,
                dataHash,
                locale,
                options
            )
        );

    public static getUid = (
        uid: string | number,
        type: HoyoType_T,
        characterId: string | number,
        characterData: object,
        locale: string,
        options: CacheOptions = defaultCacheOptions
    ) =>
        new CachedImage(
            generateUidFile(
                uid,
                type,
                characterId,
                characterData,
                locale,
                options
            )
        );
}

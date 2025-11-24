# enka.cards

Originally going to have the domain name of "enka.cards" but has now been moved over to "cards.enka.network". Read below on how to use.

With your enka.network profile, have you ever wanted the card to show up in your Discord embed? Well, now you can! Just replace your original enka.network link with cards.enka.network and you're good to go!

Example:

```
https://enka.network/u/jxtq/488BWO/10000089/3018594
```

Replace with:

```
https://cards.enka.network/u/jxtq/488BWO/10000089/3018594
```

This will now show up in your Discord embeds!

Screenshot:
![Ref](https://github.com/JayXTQ/enka.cards/blob/main/img.png)

## Accepted Links

- Standard User Account Profiles. e.g. https://enka.network/u/jxtq/488BWO/10000089/3018594
- Genshin UID Lookup links. e.g. https://enka.network/u/744008962/
- HSR UID Lookup links. e.g. https://enka.network/hsr/616910611/
- ZZZ UID Lookup links. e.g. https://enka.network/zzz/1500422486/

## How to use

1. Copy the link you want to convert.
2. Replace `enka.network` with `cards.enka.network`.
3. Paste the new link into your Discord embed. Example URL would be: https://cards.enka.network/u/jxtq/488BWO/10000089/3018594

### If you are on a UID based profile (i.e. /u/744008962)

4. Append the character ID to the end of the URL, example URL would be: https://enka.network/u/744008962/10000089

## Getting the image directly

If you have a website or Discord bot that would wish to utilise this feature, there is a route that allows for getting the image without checking if the request is from Discord or not. It also accepts all the query parameters available (listed below).

To get the image directly, just append `/image` onto the end of the pathname.

## Available query parameters (Added to the URL via [query params](https://dev.to/surbhidighe/understanding-params-and-query-params-a-simple-guide-1fi1))

- `lang={language}` - The language you wish to use, defaults to `en`. Example would be `lang=fr` for French.
- `substats` - Whether the `Roll Quality` / `Substats` toggle is enabled, requires `true` or `false`. Defaults to `false`.
- `subsBreakdown` - Whether the `Substat breakdown` toggle is enabled, requires `true` or `false`. Defaults to `false`.
- `uid` - Whether the `Show UID` toggle is enabled, requires `true` or `false`. Defaults to `true`.
- `hideNames` - Wther the `Show username` toggle is disabled, requires `true` or `false`. Defaults to `false` (The wording here is confusing, I am aware. Names are shown by default in this instance.)

## Notes

- If you go to the card link, you will get redirected to the card on enka, unless you can not which you will just be redirected to the first card enka picks for you
- If you go to the image link, you will get the image, this is the only link that doesn't redirect if Discord isn't the one fetching the link for the embed.

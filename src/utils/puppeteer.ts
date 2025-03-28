import { Response } from 'express';
import { getBrowser } from '../puppeteer';
import { Page } from 'puppeteer';
import { Sharp } from 'sharp';
import { cardify } from './sharp';
import { generateGlobalToggles, hoyo_type, HoyoType, sleep } from './misc';

export async function setupPage(locale: string, url: string, res: Response, hoyo_type: HoyoType) {
	const page = await (await getBrowser()).newPage();
	page.on('pageerror,', (err) => console.log('PAGE ERROR:', err));
	page.on('error', (err) => console.log('ERROR:', err));
	page.on('requestfailed', (req) =>
		console.log('REQUEST FAILED:', req.url()),
	);
	try {
		const globalToggles = generateGlobalToggles(hoyo_type);
		const cookies = [
			{
				name: 'locale',
				value: locale,
				domain: 'enka.network',
				path: '/',
				expires: -1,
			},
			{
				name: 'globalToggles',
				value: globalToggles,
				domain: 'enka.network',
				path: '/',
				expires: -1,
			},
		];
		await Promise.allSettled([
			page.setUserAgent(
				'Mozilla/5.0 (compatible; enka.cards/1.0; +https://cards.enka.network)',
			),
			page.setViewport({ width: 1920, height: 1080 }),
			page.setCookie(...cookies),
		]);
		await page.goto(url, { waitUntil: 'networkidle0' });
	} catch (error) {
		res.status(500);
		return res.send('An error occurred');
	}
	await page.waitForFunction('document.fonts.ready').catch(() => null);
	return page;
}

async function generateCard(page: Page, res: Response) {
	await page.waitForSelector('div.Card>div.card-host').catch(() => null);
	await page.waitForFunction('!document.querySelector("div.Card .loader")').catch(() => null);
	const html = await page.waitForSelector('div.Card').catch(() => null);
	if (!html) return res.status(500).send('No card found');
	let img: Sharp | Uint8Array | null = await html
		.screenshot({ type: 'png' })
		.catch(() => null);
	if (!img) return res.status(500).send('No image found');
	img = await cardify(img);
	await page.close();
	return img;
}

export async function getImage(locale: string, enkaurl: string, res: Response, hoyo_type: HoyoType) {
	const page = await setupPage(locale, enkaurl, res, hoyo_type);
	if (!(page instanceof Page)) return page;
	const img = await generateCard(page, res);
	return img;
}

export async function getUidImage(
	locale: string,
	enkaurl: string,
	res: Response,
	cardNumber: number,
) {
	const hoyoType = enkaurl.includes('/u/') ? hoyo_type.Genshin : enkaurl.includes('/hsr/') ? hoyo_type.Honkers : hoyo_type.Zenless;
	const page = await setupPage(locale, enkaurl, res, hoyoType);
	if (!(page instanceof Page)) return page;
	await page
		.waitForSelector('content>div.CharacterList>div.avatar.live')
		.catch(() => null);
	const selectors = await page.$$(
		'content>div.CharacterList>div.avatar.live',
	);
	if (!selectors[cardNumber]) return res.status(500).send('No card found');
	await selectors[cardNumber].click();
	const img = await generateCard(page, res);
	return img;
}

import { Request, Response } from 'express';
import { sendImage, setupGIUidRoute, setupHSRUidRoute, SetupRouteReturn, setupZZZUidRoute } from './routes';
import { isReturnable, RouteReturner } from './misc';
import { imageIfSameHash, sameHash } from './hashes';
import { client } from '../s3';

async function routeHandler(res: Response, image: boolean, route: SetupRouteReturn) {
	if(isReturnable(route)) return new RouteReturner(route).returner(res);
	const { locale, enkaUrl, result, params, hashes, cardNumber } = route;

	if(!image) {
		const imgCache = imageIfSameHash(hashes, params, locale, enkaUrl, result)

		if(isReturnable(imgCache)) return new RouteReturner(imgCache).returner(res);

		const img = await sendImage(
			locale,
			enkaUrl,
			res,
			params,
			hashes[1],
			false,
			result,
			0,
			true,
			cardNumber,
		).catch(() => null);
		if (!img) return res.status(500).send('Error sending image to client');
		if (!(img instanceof Buffer)) return img;
		res.setHeader('Content-Type', 'image/png');
		return res.end(img, 'binary');
	} else {
		let img = await client.get(params.Key).catch(() => null);

		if (!img || !sameHash(hashes)) {
			const img = await sendImage(
				locale,
				enkaUrl,
				res,
				params,
				hashes[1],
				true,
				result,
				0,
				true,
				cardNumber,
			).catch(() => null);
			if (!img) return res.status(500).send('Error sending cached image to client');
			if (!(img instanceof Buffer)) return img;
			res.setHeader('Content-Type', 'image/png');
			return res.end(img, 'binary');
		}
		res.setHeader('Content-Type', 'image/png');
		const imgBody = await img.byteArray();
		if (!imgBody) {
			const img = await sendImage(
				locale,
				enkaUrl,
				res,
				params,
				hashes[1],
				true,
				result,
				0,
				true,
				cardNumber,
			).catch(() => null);
			if (!img) return res.status(500).send('Error');
			if (!(img instanceof Buffer)) return img;
			return res.end(img, 'binary');
		}
		return res.end(imgBody, 'binary');
	}
}

export async function HSR(req: Request, res: Response, image: boolean) {
	const route = await setupHSRUidRoute(req, res, image);
	return await routeHandler(res, image, route);
}

export async function GI(req: Request, res: Response, image: boolean) {
	const route = await setupGIUidRoute(req, res, image);
	return await routeHandler(res, image, route);
}

export async function ZZZ(req: Request, res: Response, image: boolean) {
	const route = await setupZZZUidRoute(req, res, image);
	return await routeHandler(res, image, route);
}
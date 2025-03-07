import sharp, { Sharp } from 'sharp';

export async function cardify(img: Sharp | Uint8Array) {
	if (img instanceof Uint8Array) img = sharp(img);
	const imgmeta = await img.metadata();
	img = await img
		.composite([
			{
				input: Buffer.from(
					`<svg><rect x="0" y="0" width="${imgmeta.width}" height="${imgmeta.height}" rx="10" ry="10"/></svg>`,
				),
				blend: 'dest-in',
			},
		])
		.toBuffer();
	return img;
}

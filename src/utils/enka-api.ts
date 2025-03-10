import axios from 'axios';

type GICharactersAPI = Record<
	string,
	{
		[k: string]: unknown;
		NameTextMapHash: number;
	}
>;

export type Characters = {
	name: string;
	characterId: string;
	nameHash: number | string;
};

export async function getGICharacters(locale: string) {
	const locales = await getGILocales();
	const response = await axios.get(
		'https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/characters.json',
	);
	const data: GICharactersAPI = response.data;
	const returndata: Characters[] = [];
	const localedata = locales[locale] || locales['en'];
	for (const [key, value] of Object.entries(data)) {
		const name = localedata[value.NameTextMapHash];
		returndata.push({
			name,
			characterId: key,
			nameHash: value.NameTextMapHash,
		});
	}
	return returndata;
}

async function getGILocales(): Promise<Record<string, Record<string, string>>> {
	const response = await axios.get(
		'https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/loc.json',
	);
	return response.data;
}

async function getHSRLocales(): Promise<
	Record<string, Record<string, string>>
> {
	const response = await axios.get(
		'https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/hsr/hsr.json',
	);
	return response.data;
}

type HSRCharactersAPI = Record<
	string,
	{
		[k: string]: unknown;
		AvatarName: {
			Hash: number;
		};
	}
>;

export async function getHSRCharacters(locale: string) {
	const locales = await getHSRLocales();
	const response = await axios.get(
		'https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/hsr/honker_characters.json',
	);
	const data: HSRCharactersAPI = response.data;
	const returndata: Characters[] = [];
	const localedata = locales[locale] || locales['en'];
	for (const [key, value] of Object.entries(data)) {
		const name = localedata[value.AvatarName.Hash];
		returndata.push({
			name,
			characterId: key,
			nameHash: value.AvatarName.Hash,
		});
	}
	return returndata;
}

type ZZZCharactersAPI = Record<string, {
	[k: string]: unknown;
	Name: string;
}>

async function getZZZLocales() {
	const response = await axios.get(
		'https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/zzz/locs.json',
	);
	return response.data;
}

export async function getZZZCharacters(locale: string) {
	const locales = await getZZZLocales();
	const response = await axios.get(
		'https://raw.githubusercontent.com/EnkaNetwork/API-docs/refs/heads/master/store/zzz/avatars.json'
	);
	const data: ZZZCharactersAPI = response.data;
	const returndata: Characters[] = [];
	const localedata = locales[locale] || locales['en'];
	for (const [key, value] of Object.entries(data)) {
		const name = localedata[value.Name];
		returndata.push({
			name,
			characterId: key,
			nameHash: value.Name
		});
	}
	return returndata;
}

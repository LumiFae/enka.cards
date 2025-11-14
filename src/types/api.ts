export const HoyoType = {
    Genshin: 0,
    Honkai: 1,
    Zenless: 2,
} as const;

export type HoyoType_T = (typeof HoyoType)[keyof typeof HoyoType];

export interface Profile {
	signup_state: number;
	bio: string;
	level: number;
	avatar?: string;
	image_url: string;
	last_read_ts: string;
}

export interface User {
    id: number;
	profile: Profile;
	username: string;

	me?: boolean;
}

export interface BaseHoyoProfile {
    id: number;
	hash: string | null;
	user: User;
	uid: number;
	verified: boolean;
	public: boolean;
	uid_public: boolean;
	live_public: boolean;
    // Will never need to access this.
	player_info: never;
	verification_code: string | null;
	verification_expire: string | null;
	verification_code_retries: number;
	avatar_order: string[] | null;
	hoyo_type: HoyoType_T;
	order: number;
	region: string;
	refreshed_at: string;
	live_data_hash: number;
}

// Only avatarId is needed here, so this is just a basic implementation.
export interface GenshinUid {
    avatarInfoList: {
        avatarId: number;
    }[]
}

export interface HonkaiUid {
    detailInfo: {
        avatarDetailList: {
            avatarId: number;
        }[]
    }
}

export interface ZenlessUid {
    PlayerInfo: {
        ShowcaseDetail: {
            AvatarList: {
                Id: number
            }[]
        }
    }
}
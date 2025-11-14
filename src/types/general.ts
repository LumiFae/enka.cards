export interface CacheOptions {
    /**
     * Roll Quality check
     */
    substats: boolean;
    /**
     * Substat breakdown check
     */
    subsBreakdown: boolean;
    /**
     * Show UID check
     */
    uid: boolean;
    /**
     * Inverse Show username check
     */
    hideNames: boolean;
}

// Example globalToggles
// {"uid":true,"nickname":true,"dark":false,"saveImageToServer":false,"substats":false,"subsBreakdown":false,"userContent":false,"adaptiveColor":false,"profileCategory":0,"hideNames":false,"hoyo_type":0,"wedge":false,"autoOpenSidebar":true,"lastReadTs":1742381697707}
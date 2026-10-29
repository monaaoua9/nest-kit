export declare function generateOtp(len?: number): string;
export declare function hashOtp(code: string, secret: string): string;
export declare function verifyOtp(code: string, hash: string, secret: string): boolean;

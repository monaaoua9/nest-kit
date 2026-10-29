export interface Page<T> {
    data: T[];
    meta: {
        nextCursor: string | null;
        hasMore: boolean;
    };
}
export declare function encodeCursor(v: Record<string, unknown>): string;
export declare function decodeCursor<T = Record<string, unknown>>(cursor: string): T;
export declare function toPage<T>(rows: T[], limit: number, cursorOf: (row: T) => Record<string, unknown>): Page<T>;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeCursor = encodeCursor;
exports.decodeCursor = decodeCursor;
exports.toPage = toPage;
function encodeCursor(v) {
    return Buffer.from(JSON.stringify(v)).toString('base64url');
}
function decodeCursor(cursor) {
    try {
        return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    }
    catch {
        throw new Error('invalid cursor');
    }
}
// query with take: limit + 1, pass the rows straight in
function toPage(rows, limit, cursorOf) {
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const last = data[data.length - 1];
    return {
        data,
        meta: { nextCursor: hasMore && last ? encodeCursor(cursorOf(last)) : null, hasMore },
    };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = generateOtp;
exports.hashOtp = hashOtp;
exports.verifyOtp = verifyOtp;
const crypto_1 = require("crypto");
function generateOtp(len = 6) {
    return String((0, crypto_1.randomInt)(0, 10 ** len)).padStart(len, '0');
}
// keyed hash on purpose: a plain hash of 6 digits is brute-forced instantly
function hashOtp(code, secret) {
    return (0, crypto_1.createHmac)('sha256', secret).update(code).digest('hex');
}
function verifyOtp(code, hash, secret) {
    const a = Buffer.from(hashOtp(code, secret));
    const b = Buffer.from(hash);
    return a.length === b.length && (0, crypto_1.timingSafeEqual)(a, b);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEnv = createEnv;
function createEnv(src = process.env) {
    const missing = [];
    function raw(name, hasDefault) {
        const v = src[name];
        if (v === undefined || v === '') {
            if (!hasDefault)
                missing.push(name);
            return undefined;
        }
        return v;
    }
    return {
        str(name, def) {
            return (raw(name, def !== undefined) ?? def);
        },
        int(name, def) {
            const v = raw(name, def !== undefined);
            if (v === undefined)
                return def;
            const n = Number(v);
            if (!Number.isInteger(n))
                throw new Error(`${name} must be an integer`);
            return n;
        },
        bool(name, def) {
            const v = raw(name, def !== undefined);
            if (v === undefined)
                return def;
            return ['1', 'true', 'yes'].includes(v.toLowerCase());
        },
        // call once after reading everything, reports all missing vars together
        done() {
            if (missing.length)
                throw new Error(`missing env: ${missing.join(', ')}`);
        },
    };
}

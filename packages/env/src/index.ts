type Source = Record<string, string | undefined>;

export function createEnv(src: Source = process.env) {
  const missing: string[] = [];

  function raw(name: string, hasDefault: boolean) {
    const v = src[name];
    if (v === undefined || v === '') {
      if (!hasDefault) missing.push(name);
      return undefined;
    }
    return v;
  }

  return {
    str(name: string, def?: string): string {
      return (raw(name, def !== undefined) ?? def) as string;
    },
    int(name: string, def?: number): number {
      const v = raw(name, def !== undefined);
      if (v === undefined) return def as number;
      const n = Number(v);
      if (!Number.isInteger(n)) throw new Error(`${name} must be an integer`);
      return n;
    },
    bool(name: string, def?: boolean): boolean {
      const v = raw(name, def !== undefined);
      if (v === undefined) return def as boolean;
      return ['1', 'true', 'yes'].includes(v.toLowerCase());
    },
    list(name: string, def?: string[]): string[] {
      const v = raw(name, def !== undefined);
      if (v === undefined) return def as string[];
      return v.split(",").map(x => x.trim()).filter(Boolean);
    },
    oneOf<T extends string>(name: string, values: readonly T[], def?: T): T {
      const v = raw(name, def !== undefined);
      if (v === undefined) return def as T;
      if (!values.includes(v as T)) throw new Error(`${name} must be one of ${values.join(", ")}`);
      return v as T;
    },
    // call once after reading everything, reports all missing vars together
    done() {
      if (missing.length) throw new Error(`missing env: ${missing.join(', ')}`);
    },
  };
}

type Source = Record<string, string | undefined>;
export declare function createEnv(src?: Source): {
    str(name: string, def?: string): string;
    int(name: string, def?: number): number;
    bool(name: string, def?: boolean): boolean;
    done(): void;
};
export {};

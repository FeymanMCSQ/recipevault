declare module "@prisma/config" {
    export function defineConfig(config: {
        schema?: string;
        datasource?: {
            url?: string;
            shadowDatabaseUrl?: string;
        };
        migrations?: {
            seed?: string;
        };
    }): typeof config;
}

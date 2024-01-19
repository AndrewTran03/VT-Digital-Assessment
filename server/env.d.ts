declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // Secret enviornment variables (allows for TypeScript intellisense)
            BACKEND_PORT: number;
            CANVAS_PUBLIC_API_TOKEN: string;
        }
    }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};

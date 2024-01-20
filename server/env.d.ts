import { z } from "zod";

// Include secret enviornment variables here (allows for TypeScript intellisense)
const processEnvSchema = z.object({
  BACKEND_PORT: z.number(),
  CANVAS_PUBLIC_API_TOKEN: z.string()
});
processEnvSchema.parse(process.env);

declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof processEnvSchema> {}
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};

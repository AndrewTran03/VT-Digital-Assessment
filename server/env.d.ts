import log from "./src/utils/logger";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

// Include secret enviornment variables here
const processEnvSchema = z
  .object({
    FRONTEND_PORT: z.number().gte(1000),
    BACKEND_PORT: z.number().gte(1000),
    CANVAS_PUBLIC_API_TOKEN: z.string().min(1),
    USERNAME: z.string().min(1),
    PASSWORD: z.string().min(1),
    DEPLOYMENT_NAME: z.string().min(1),
    MONGO_DB_NAME: z.string().min(1),
    CANVAS_OBJECTIVE_COLLECTION_NAME: z.string().min(1),
    CANVAS_QUIZZES_COLLECTION_NAME: z.string().min(1),
    CANVAS_USER_API_COLLECTION_NAME: z.string().min(1),
    CANVAS_ASSIGNMENT_RUBRIC_COLLECTION_NAME: z.string().min(1)
  })
  .strict();
const envParseResult = processEnvSchema.safeParse(process.env);
// Checking if enviornment variables (in ".env" file) were setup properly
if (!envParseResult.success) {
  log.error(fromZodError(envParseResult.error));
  process.exit(1);
}

// Allows for global TypeScript intellisense of process.env variables in the backend
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof processEnvSchema> {}
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {};

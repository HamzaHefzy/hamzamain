import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { join } from "node:path";

for (const filename of [".env.local", ".env"]) {
  const path = join(process.cwd(), filename);
  if (existsSync(path)) {
    loadEnvFile(path);
  }
}

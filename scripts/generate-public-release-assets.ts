import fs from "node:fs/promises";
import path from "node:path";
import { buildPublicReleaseAssets } from "../src/services/artifacts/public-release-assets.js";

async function writeFile(rootDir: string, relativePath: string, content: string): Promise<void> {
  const absolutePath = path.join(rootDir, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, "utf8");
}

async function main(): Promise<void> {
  const rootDir = process.cwd();
  const assets = buildPublicReleaseAssets();

  for (const file of assets.files) {
    await writeFile(rootDir, file.path, file.content);
  }

  await writeFile(rootDir, assets.transcriptPath, JSON.stringify(assets.transcript, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

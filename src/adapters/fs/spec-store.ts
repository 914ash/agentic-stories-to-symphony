import fs from "node:fs/promises";
import path from "node:path";
import type { SpecRevision } from "../../types/spec.js";

export async function saveSpecRevision(rootDir: string, revision: SpecRevision): Promise<{
  markdownPath: string;
  jsonPath: string;
}> {
  const revisionDir = path.join(rootDir, "specs", revision.metadata.specId, "revisions");
  await fs.mkdir(revisionDir, { recursive: true });

  const markdownPath = path.join(revisionDir, `${revision.metadata.revision}.md`);
  const jsonPath = path.join(revisionDir, `${revision.metadata.revision}.json`);

  await Promise.all([
    fs.writeFile(markdownPath, revision.markdown, "utf8"),
    fs.writeFile(jsonPath, JSON.stringify(revision, null, 2), "utf8")
  ]);

  return {
    markdownPath,
    jsonPath
  };
}

import { describe, expect, test } from "vitest";
import { buildPublicReleaseAssets } from "../../../../src/services/artifacts/public-release-assets.js";

describe("buildPublicReleaseAssets", () => {
  test("creates a stable sanitized transcript and screenshot set", () => {
    const assets = buildPublicReleaseAssets();

    expect(assets.transcriptPath).toBe("artifacts/public-release/transcript.json");
    expect(assets.files).toHaveLength(7);
    expect(assets.files.map((file) => file.path)).toContain("artifacts/public-release/05-linear-projection.svg");
    expect(JSON.stringify(assets.transcript)).toContain("ASTS-101");
    expect(JSON.stringify(assets.transcript)).not.toContain("N14");
    expect(JSON.stringify(assets.transcript)).not.toContain("C:\\");
  });

  test("renders svg terminal captures with public-safe copy", () => {
    const assets = buildPublicReleaseAssets();
    const svg = assets.files.find((file) => file.path.endsWith("06-execution-watch.svg"));

    expect(svg?.content).toContain("Agentic Stories To Symphony");
    expect(svg?.content).toContain("Symphony picked up ASTS-101.");
    expect(svg?.content).not.toContain("ENG-301");
  });
});

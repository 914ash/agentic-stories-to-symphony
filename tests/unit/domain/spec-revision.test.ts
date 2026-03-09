import { describe, expect, test } from "vitest";
import { transitionRevisionStatus } from "../../../src/domain/spec-revision.js";

describe("transitionRevisionStatus", () => {
  test("allows a draft revision to move into approved", () => {
    expect(transitionRevisionStatus("draft", "approved")).toBe("approved");
  });

  test("rejects moving an approved revision back to draft", () => {
    expect(() => transitionRevisionStatus("approved", "draft")).toThrow(
      "Cannot transition spec revision from approved to draft"
    );
  });
});

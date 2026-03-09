import { describe, expect, test } from "vitest";
import { parseMultilineEntries } from "../../../../src/services/intake/list-parser.js";

describe("parseMultilineEntries", () => {
  test("preserves commas within a single entered sentence", () => {
    expect(
      parseMultilineEntries("Spec stays canonical, approval is explicit, and state remains system-managed")
    ).toEqual(["Spec stays canonical, approval is explicit, and state remains system-managed"]);
  });

  test("splits newline-delimited entries and drops blanks", () => {
    expect(
      parseMultilineEntries("First item\n\nSecond item\r\nThird item")
    ).toEqual(["First item", "Second item", "Third item"]);
  });
});

// GUARD — Xiaomi MiMo OAuth login failed with "crypto.randomUUID is not a
// function" when the dashboard is accessed over plain HTTP on a non-localhost
// host (LAN IP): Web Crypto's randomUUID only exists in secure contexts, so it
// is undefined in the browser there. The client-side modal must generate the
// OAuth `state` via the uuid-backed `generateId` utility (see AGENTS.md-style
// guards in this suite for the source-reading pattern).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateId } from "../../src/shared/utils/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const modalSrc = readFileSync(
  join(here, "..", "..", "src", "shared", "components", "XiaomiMimoAuthModal.js"),
  "utf8",
);
// Strip standalone // comment lines so the guard below checks real code, not
// documentation comments that merely mention the banned API.
const modalCode = modalSrc
  .split("\n")
  .filter((line) => !/^\s*\/\//.test(line))
  .join("\n");

describe("XiaomiMimoAuthModal OAuth state generation", () => {
  it("does not call crypto.randomUUID (insecure-context crash)", () => {
    expect(modalCode).not.toMatch(/crypto\.randomUUID/);
  });

  it("uses the uuid-backed generateId utility for the OAuth state", () => {
    expect(modalCode).toMatch(/const state = generateId\(\)/);
  });

  it("generateId produces a UUID v4 via uuid (works in insecure contexts)", () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    // And it must be unique per call.
    expect(generateId()).not.toBe(id);
  });
});

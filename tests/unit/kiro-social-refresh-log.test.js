// Regression guard (AGENTS.md §8): the Kiro social token refresh failure log
// must identify WHICH account failed ("Name <email>"), not just the provider.
// With multiple Kiro connections connected, a bare "Failed to refresh Kiro
// social token" gives the user no way to tell which account to re-auth.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalFetch = global.fetch;

function makeLog() {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

describe("Kiro social token refresh failure log identifies the account", () => {
  beforeEach(() => {
    vi.resetModules();
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("logs both name and email on social refresh failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve("denied"),
    });

    const log = makeLog();
    const { refreshKiroToken } = await import("../../open-sse/services/tokenRefresh.js");
    const result = await refreshKiroToken("social-refresh-a", {}, log, null, {
      name: "Denny",
      email: "denny@example.com",
    });

    expect(result).toBeNull();
    expect(log.error).toHaveBeenCalledTimes(1);
    const [tag, message] = log.error.mock.calls[0];
    expect(tag).toBe("TOKEN_REFRESH");
    expect(message).toBe("Failed to refresh Kiro social token for account: Denny <denny@example.com>");
  });

  it("falls back to email only when no name is stored", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: () => Promise.resolve("expired"),
    });

    const log = makeLog();
    const { refreshKiroToken } = await import("../../open-sse/services/tokenRefresh.js");
    await refreshKiroToken("social-refresh-b", {}, log, null, { email: "only@example.com" });

    expect(log.error.mock.calls[0][1]).toBe(
      "Failed to refresh Kiro social token for account: only@example.com"
    );
  });

  it("says 'unknown account' when the connection carries no identity", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("boom"),
    });

    const log = makeLog();
    const { refreshKiroToken } = await import("../../open-sse/services/tokenRefresh.js");
    await refreshKiroToken("social-refresh-c", {}, log, null, null);

    expect(log.error.mock.calls[0][1]).toBe(
      "Failed to refresh Kiro social token for account: unknown account"
    );
  });

  it("formatKiroAccountLabel prefers displayName when name is absent", async () => {
    const { formatKiroAccountLabel } = await import(
      "../../open-sse/services/tokenRefresh/providers.js"
    );
    expect(formatKiroAccountLabel({ displayName: "Display", email: "x@y.z" })).toBe(
      "Display <x@y.z>"
    );
    expect(formatKiroAccountLabel({})).toBe("unknown account");
    expect(formatKiroAccountLabel(null)).toBe("unknown account");
  });
});
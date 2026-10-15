import { afterEach, describe, expect, it, vi } from "vitest";
import { testInternetSpeed } from "./internetSpeedTest";

afterEach(() => vi.unstubAllGlobals());

describe("testInternetSpeed", () => {
  it("fails the check when the candidate has no connection at all", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const result = await testInternetSpeed();

    expect(result.passed).toBe(false);
    expect(result.download).toBe(0);
    expect(result.ping).toBe(999);
  });

  // When every upload attempt fails, it reports a made-up 0.5 MB/s (4 Mbps),
  // exactly the minimum, so the upload line shows green for a dead connection.
  it.fails("does not report an upload speed when no upload succeeded (known defect)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const result = await testInternetSpeed();

    expect(result.upload).toBe(0);
  });
});

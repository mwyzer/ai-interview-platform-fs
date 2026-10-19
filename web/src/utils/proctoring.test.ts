import { afterEach, describe, expect, it, vi } from "vitest";
import { isDesktopChrome, requestEntireScreen } from "./proctoring";

// Real user-agent strings, one per browser a candidate might open the link in.
const UA = {
  chromeWindows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  chromeMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  opera: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0",
  chromeAndroid: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  chromeIphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1",
  firefox: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0",
  safariMac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
};

const brands = (...names: string[]) => names.map((brand) => ({ brand, version: "130" }));

describe("isDesktopChrome", () => {
  it("accepts Chrome on Windows and macOS", () => {
    expect(isDesktopChrome(UA.chromeWindows, undefined)).toBe(true);
    expect(isDesktopChrome(UA.chromeMac, undefined)).toBe(true);
  });

  it("refuses other browsers that say Chrome in their user agent, and every phone", () => {
    for (const ua of [UA.edge, UA.opera, UA.chromeAndroid, UA.chromeIphone, UA.firefox, UA.safariMac]) {
      expect(isDesktopChrome(ua, undefined), ua).toBe(false);
    }
  });

  it("trusts the browser's own brand list when it has one (Brave's user agent is Chrome's)", () => {
    expect(isDesktopChrome(UA.chromeWindows, { mobile: false, brands: brands("Chromium", "Google Chrome", "Not?A_Brand") })).toBe(true);
    expect(isDesktopChrome(UA.chromeWindows, { mobile: false, brands: brands("Chromium", "Brave", "Not?A_Brand") })).toBe(false);
    expect(isDesktopChrome(UA.chromeAndroid, { mobile: true, brands: brands("Chromium", "Google Chrome") })).toBe(false);
  });
});

describe("requestEntireScreen", () => {
  afterEach(() => vi.restoreAllMocks());

  function shareReturning(displaySurface: string) {
    const track = { stop: vi.fn(), getSettings: () => ({ displaySurface }) };
    const stream = { getVideoTracks: () => [track], getTracks: () => [track] } as unknown as MediaStream;
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getDisplayMedia: vi.fn().mockResolvedValue(stream) },
    });
    return track;
  }

  it("keeps a share of the entire screen", async () => {
    shareReturning("monitor");
    const result = await requestEntireScreen();
    expect(result.ok).toBe(true);
  });

  it("stops and refuses a share of a tab or a window", async () => {
    for (const surface of ["browser", "window"]) {
      const track = shareReturning(surface);
      expect(await requestEntireScreen()).toEqual({ ok: false, reason: "not_entire_screen" });
      expect(track.stop).toHaveBeenCalled();
    }
  });

  it("reports a refused prompt as denied", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getDisplayMedia: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")) },
    });
    expect(await requestEntireScreen()).toEqual({ ok: false, reason: "denied" });
  });
});

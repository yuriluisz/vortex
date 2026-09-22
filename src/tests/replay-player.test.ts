import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  formatTime,
  validateReplayEvents,
  calculateReplayScale,
  calculateReplayDuration,
  lockBodyScroll,
} from "@/components/admin/recordings/ReplayPlayerModal";

describe("Replay Player Logic, Scaling & Event Validation", () => {
  describe("formatTime", () => {
    it("should format valid seconds into mm:ss format", () => {
      expect(formatTime(0)).toBe("0:00");
      expect(formatTime(9)).toBe("0:09");
      expect(formatTime(59)).toBe("0:59");
      expect(formatTime(60)).toBe("1:00");
      expect(formatTime(75)).toBe("1:15");
      expect(formatTime(360)).toBe("6:00");
    });

    it("should safely handle NaN, negative numbers and invalid inputs", () => {
      expect(formatTime(NaN)).toBe("0:00");
      expect(formatTime(-10)).toBe("0:00");
    });
  });

  describe("validateReplayEvents", () => {
    it("should reject null, undefined or empty arrays", () => {
      expect(validateReplayEvents(null).valid).toBe(false);
      expect(validateReplayEvents(undefined).valid).toBe(false);
      expect(validateReplayEvents([]).valid).toBe(false);
      expect(validateReplayEvents("not-an-array").valid).toBe(false);
    });

    it("should reject events with insufficient count", () => {
      const singleEvent = [{ type: 2, timestamp: 1000, data: {} }];
      const res = validateReplayEvents(singleEvent);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("insuficientes");
    });

    it("should reject events when no FullSnapshot (type 2) exists", () => {
      const incrementalOnly = [
        { type: 4, timestamp: 1000, data: { width: 400, height: 800 } },
        { type: 3, timestamp: 1050, data: {} },
        { type: 3, timestamp: 1100, data: {} },
      ];
      const res = validateReplayEvents(incrementalOnly);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("snapshot inicial");
    });

    it("should filter out corrupted events with invalid timestamps and accept valid ones", () => {
      const mixedEvents = [
        { type: 4, timestamp: 2000, data: {} },
        { type: 2, timestamp: 1000, data: {} }, // FullSnapshot
        { type: 3, timestamp: "invalid", data: {} }, // Corrupted
        null,
        undefined,
        { type: "string", timestamp: 1500 }, // Corrupted
      ];
      const res = validateReplayEvents(mixedEvents);
      expect(res.valid).toBe(true);
      expect(res.events).toHaveLength(2);
      // Deve ordenar cronologicamente: timestamp 1000 antes de 2000
      expect(res.events![0].timestamp).toBe(1000);
      expect(res.events![1].timestamp).toBe(2000);
    });
  });

  describe("calculateReplayScale", () => {
    it("should calculate correct scale for mobile portrait screen on desktop container", () => {
      // Container 1000x700 (usable 968x668), Mobile content 390x844
      // scaleW = 968 / 390 = 2.48, scaleH = 668 / 844 = 0.791
      // Deve escolher scaleH = 0.791
      const scale = calculateReplayScale(1000, 700, 390, 844, 32);
      expect(scale).toBeCloseTo(0.791, 2);
    });

    it("should calculate correct scale for desktop screen on smaller container", () => {
      // Container 800x600 (usable 768x568), Desktop content 1920x1080
      // scaleW = 768 / 1920 = 0.40, scaleH = 568 / 1080 = 0.525
      // Deve escolher scaleW = 0.40
      const scale = calculateReplayScale(800, 600, 1920, 1080, 32);
      expect(scale).toBeCloseTo(0.4, 2);
    });

    it("should cap scale at 1.0 when container is larger than content to prevent pixelation", () => {
      // Container 2000x1500, Content 400x800
      const scale = calculateReplayScale(2000, 1500, 400, 800, 32);
      expect(scale).toBe(1);
    });

    it("should return fallback 1 when dimensions are zero or negative", () => {
      expect(calculateReplayScale(0, 0, 1920, 1080)).toBe(1);
      expect(calculateReplayScale(800, 600, 0, 0)).toBe(1);
      expect(calculateReplayScale(-100, -100, 400, 800)).toBe(1);
    });
  });

  describe("calculateReplayDuration", () => {
    it("should return rounded seconds from valid metadata totalTime in ms", () => {
      expect(calculateReplayDuration(5400, 5)).toBe(5);
      expect(calculateReplayDuration(5600, 5)).toBe(6);
    });

    it("should fallback to recording duration if totalTime is zero, negative or NaN", () => {
      expect(calculateReplayDuration(0, 42)).toBe(42);
      expect(calculateReplayDuration(-100, 30)).toBe(30);
      expect(calculateReplayDuration(NaN, 18)).toBe(18);
      expect(calculateReplayDuration(null, 25)).toBe(25);
    });

    it("should return minimum 1 second if all sources are zero or invalid", () => {
      expect(calculateReplayDuration(0, 0)).toBe(1);
      expect(calculateReplayDuration(null, null)).toBe(1);
    });
  });

  describe("lockBodyScroll (Reference Counted)", () => {
    let originalBody: HTMLBodyElement;

    beforeEach(() => {
      // Setup fake document.body
      originalBody = (globalThis as any).document?.body;
      if (!originalBody) {
        (globalThis as any).document = {
          body: {
            style: { overflow: "auto" },
            dataset: {},
          },
        };
      } else {
        originalBody.style.overflow = "auto";
        delete originalBody.dataset.vtxModalLocks;
        delete originalBody.dataset.vtxPrevOverflow;
      }
    });

    afterEach(() => {
      if (originalBody) {
        (globalThis as any).document.body = originalBody;
      }
    });

    it("should lock overflow to hidden on first call and preserve original", () => {
      const body = (globalThis as any).document.body;
      body.style.overflow = "auto";

      const unlock1 = lockBodyScroll();
      expect(body.style.overflow).toBe("hidden");
      expect(body.dataset.vtxModalLocks).toBe("1");
      expect(body.dataset.vtxPrevOverflow).toBe("auto");

      unlock1();
      expect(body.style.overflow).toBe("auto");
      expect(body.dataset.vtxModalLocks).toBeUndefined();
    });

    it("should handle nested locks safely without prematurely unlocking", () => {
      const body = (globalThis as any).document.body;
      body.style.overflow = "";

      const unlock1 = lockBodyScroll();
      expect(body.dataset.vtxModalLocks).toBe("1");
      expect(body.style.overflow).toBe("hidden");

      const unlock2 = lockBodyScroll();
      expect(body.dataset.vtxModalLocks).toBe("2");
      expect(body.style.overflow).toBe("hidden");

      // Primeiro unlock não deve liberar o overflow
      unlock2();
      expect(body.dataset.vtxModalLocks).toBe("1");
      expect(body.style.overflow).toBe("hidden");

      // Segundo unlock libera o overflow
      unlock1();
      expect(body.dataset.vtxModalLocks).toBeUndefined();
      expect(body.style.overflow).toBe("");
    });
  });
});

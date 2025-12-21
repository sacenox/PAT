/* personal-assistant-thing/src/lib/ratelimit.test.ts */

import * as cacheModule from "@/src/lib/cache";
import { createRateLimiter, type RateLimitConfig } from "@/src/lib/ratelimit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the cache module
vi.mock("@/src/lib/cache", () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
}));

describe("createRateLimiter", () => {
  const mockGetCache = vi.mocked(cacheModule.getCache);
  const mockSetCache = vi.mocked(cacheModule.setCache);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Initial state", () => {
    it("should create a new rate limiter with no existing cache", async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(mockGetCache).toHaveBeenCalledWith("ratelimit:test-limiter");
      expect(mockSetCache).toHaveBeenCalled();
    });

    it("should use existing cache state if available", async () => {
      const existingState = {
        windowStart: Date.now() - 100,
        requestCount: 3,
      };
      mockGetCache.mockResolvedValue(existingState);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
    });
  });

  describe("check()", () => {
    it("should allow requests when under the limit", async () => {
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 100,
        requestCount: 5,
      });

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBeGreaterThan(Date.now());
      expect(result.hoursUntilReset).toBeGreaterThanOrEqual(0);
    });

    it("should deny requests when at the limit", async () => {
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 100,
        requestCount: 10,
      });

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it("should deny requests when over the limit", async () => {
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 100,
        requestCount: 15,
      });

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should calculate reset time correctly", async () => {
      const windowStart = Date.now() - 500;
      mockGetCache.mockResolvedValue({
        windowStart,
        requestCount: 3,
      });

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.resetAt).toBe(windowStart + 1000);
    });
  });

  describe("increment()", () => {
    it("should increment request count", async () => {
      const initialState = {
        windowStart: Date.now() - 100,
        requestCount: 5,
      };
      mockGetCache.mockResolvedValue(initialState);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      await limiter.increment();

      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:test-limiter", {
        windowStart: initialState.windowStart,
        requestCount: 6,
      });
    });

    it("should increment from zero", async () => {
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 100,
        requestCount: 0,
      });
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      await limiter.increment();

      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:test-limiter", {
        windowStart: expect.any(Number),
        requestCount: 1,
      });
    });

    it("should create new state if cache is empty", async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      await limiter.increment();

      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:test-limiter", {
        windowStart: expect.any(Number),
        requestCount: 1,
      });
    });
  });

  describe("Window expiration", () => {
    it("should reset window when expired", async () => {
      const expiredState = {
        windowStart: Date.now() - 2000, // 2 seconds ago, window is 1 second
        requestCount: 10,
      };
      mockGetCache.mockResolvedValue(expiredState);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:test-limiter", {
        windowStart: expect.any(Number),
        requestCount: 0,
      });
    });

    it("should reset window when exactly at expiration time", async () => {
      const expiredState = {
        windowStart: Date.now() - 1000, // Exactly at expiration
        requestCount: 10,
      };
      mockGetCache.mockResolvedValue(expiredState);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:test-limiter", {
        windowStart: expect.any(Number),
        requestCount: 0,
      });
    });

    it("should not reset window when not expired", async () => {
      const validState = {
        windowStart: Date.now() - 500, // 500ms ago, window is 1000ms
        requestCount: 5,
      };
      mockGetCache.mockResolvedValue(validState);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      // Should not reset, so setCache should not be called for reset
      // (it might be called for initial state creation, but not for reset)
    });
  });

  describe("reset()", () => {
    it("should manually reset the rate limit window", async () => {
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      await limiter.reset();

      // Verify reset was called with correct state
      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:test-limiter", {
        windowStart: expect.any(Number),
        requestCount: 0,
      });

      // Verify the reset worked - mock getCache to return the reset state
      const resetTime = Date.now();
      mockGetCache.mockResolvedValue({
        windowStart: resetTime,
        requestCount: 0,
      });

      const result = await limiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);
    });
  });

  describe("getState()", () => {
    it("should return current state without modifying it", async () => {
      const state = {
        windowStart: Date.now() - 100,
        requestCount: 3,
      };
      mockGetCache.mockResolvedValue(state);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.getState();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(7);
      expect(result.resetAt).toBe(state.windowStart + 1000);
      // Should not modify state (getState doesn't call saveState)
      // Note: loadState might call setCache if state doesn't exist, but in this case it does
    });

    it("should return correct state when at limit", async () => {
      const state = {
        windowStart: Date.now() - 100,
        requestCount: 10,
      };
      mockGetCache.mockResolvedValue(state);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.getState();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should return correct state when over limit", async () => {
      const state = {
        windowStart: Date.now() - 100,
        requestCount: 15,
      };
      mockGetCache.mockResolvedValue(state);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.getState();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero maxRequests", async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 0,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should handle very large windowMs", async () => {
      const state = {
        windowStart: Date.now() - 100,
        requestCount: 5,
      };
      mockGetCache.mockResolvedValue(state);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);
      const result = await limiter.check();

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetAt).toBe(state.windowStart + config.windowMs);
    });

    it("should handle multiple rate limiters with different identifiers", async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(undefined);

      const config1: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "limiter-1",
      };

      const config2: RateLimitConfig = {
        maxRequests: 20,
        windowMs: 2000,
        identifier: "limiter-2",
      };

      const limiter1 = createRateLimiter(config1);
      const limiter2 = createRateLimiter(config2);

      await limiter1.increment();
      await limiter2.increment();

      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:limiter-1", expect.any(Object));
      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:limiter-2", expect.any(Object));
    });

    it("should handle rapid increments", async () => {
      let requestCount = 0;
      mockGetCache.mockImplementation(async () => ({
        windowStart: Date.now() - 100,
        requestCount,
      }));
      mockSetCache.mockImplementation(async () => {
        requestCount++;
      });

      const config: RateLimitConfig = {
        maxRequests: 5,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);

      // Increment multiple times rapidly
      await limiter.increment();
      await limiter.increment();
      await limiter.increment();

      const result = await limiter.check();
      // requestCount is not exposed in RateLimitResult, but we can verify via remaining
      expect(result.remaining).toBeLessThanOrEqual(2); // 5 - 3 = 2
    });
  });

  describe("Integration scenarios", () => {
    it("should work correctly for a full request cycle", async () => {
      mockGetCache.mockResolvedValue(null);
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 3,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);

      // First request
      let result = await limiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(3);
      await limiter.increment();

      // Second request
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 50,
        requestCount: 1,
      });
      result = await limiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      await limiter.increment();

      // Third request
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 50,
        requestCount: 2,
      });
      result = await limiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(1);
      await limiter.increment();

      // Fourth request (should be denied)
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 50,
        requestCount: 3,
      });
      result = await limiter.check();
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should reset after window expires and allow new requests", async () => {
      // Start with expired window
      mockGetCache.mockResolvedValue({
        windowStart: Date.now() - 2000,
        requestCount: 10,
      });
      mockSetCache.mockResolvedValue(undefined);

      const config: RateLimitConfig = {
        maxRequests: 10,
        windowMs: 1000,
        identifier: "test-limiter",
      };

      const limiter = createRateLimiter(config);

      // Check should reset and allow
      const result = await limiter.check();
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(10);

      // Verify reset was called
      expect(mockSetCache).toHaveBeenCalledWith("ratelimit:test-limiter", {
        windowStart: expect.any(Number),
        requestCount: 0,
      });
    });
  });
});

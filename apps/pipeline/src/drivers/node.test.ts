import { describe, it, expect, vi, afterEach } from "vitest";
import { NodeTestWatcher } from "./node";

describe("NodeTestWatcher", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the callback with a GeolocationFix", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const cleanup = NodeTestWatcher.start(callback);

    vi.advanceTimersByTime(5000);

    expect(callback).toHaveBeenCalledTimes(1);
    const fix = callback.mock.calls[0][0];
    expect(fix).toHaveProperty("latitude");
    expect(fix).toHaveProperty("longitude");
    expect(fix).toHaveProperty("accuracy", 10);
    expect(fix).toHaveProperty("timestamp");
    expect(typeof fix.latitude).toBe("number");
    expect(typeof fix.longitude).toBe("number");

    cleanup();
  });

  it("emits fixes at the configured debounceMs interval", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const cleanup = NodeTestWatcher.start(callback);

    vi.advanceTimersByTime(10000);
    expect(callback).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(3);

    cleanup();
  });

  it("stops emitting after cleanup is called", () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const cleanup = NodeTestWatcher.start(callback);

    vi.advanceTimersByTime(5000);
    expect(callback).toHaveBeenCalledTimes(1);

    cleanup();

    vi.advanceTimersByTime(10000);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

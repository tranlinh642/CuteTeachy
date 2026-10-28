import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CountdownManager } from './resend-countdown';

describe('CountdownManager (resend countdown logic)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with default 0 seconds remaining and canResend=true', () => {
    const countdown = new CountdownManager({ defaultDuration: 60 });
    expect(countdown.secondsLeft).toBe(0);
    expect(countdown.isCounting).toBe(false);
    expect(countdown.canResend).toBe(true);
  });

  it('starts countdown with 60 seconds and disables resend while counting', () => {
    const ticks: number[] = [];
    const countdown = new CountdownManager({
      defaultDuration: 60,
      onTick: (sec) => ticks.push(sec),
    });

    countdown.start();
    expect(countdown.secondsLeft).toBe(60);
    expect(countdown.isCounting).toBe(true);
    expect(countdown.canResend).toBe(false);

    // Fast-forward 1 second
    vi.advanceTimersByTime(1000);
    expect(countdown.secondsLeft).toBe(59);
    expect(ticks).toContain(59);
    expect(countdown.canResend).toBe(false);

    // Fast-forward 58 seconds
    vi.advanceTimersByTime(58000);
    expect(countdown.secondsLeft).toBe(1);
    expect(countdown.canResend).toBe(false);

    // Fast-forward last second to 0
    vi.advanceTimersByTime(1000);
    expect(countdown.secondsLeft).toBe(0);
    expect(countdown.isCounting).toBe(false);
    expect(countdown.canResend).toBe(true);
  });

  it('calls onComplete when timer reaches zero', () => {
    let completed = false;
    const countdown = new CountdownManager({
      defaultDuration: 60,
      onComplete: () => {
        completed = true;
      },
    });

    countdown.start(5);
    expect(countdown.secondsLeft).toBe(5);

    vi.advanceTimersByTime(4000);
    expect(completed).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(countdown.secondsLeft).toBe(0);
    expect(completed).toBe(true);
  });

  it('resets timer immediately on reset()', () => {
    const countdown = new CountdownManager({ defaultDuration: 60 });
    countdown.start();
    expect(countdown.secondsLeft).toBe(60);

    vi.advanceTimersByTime(10000);
    expect(countdown.secondsLeft).toBe(50);

    countdown.reset();
    expect(countdown.secondsLeft).toBe(0);
    expect(countdown.isCounting).toBe(false);
    expect(countdown.canResend).toBe(true);

    // Advance time to verify interval was cleared
    vi.advanceTimersByTime(5000);
    expect(countdown.secondsLeft).toBe(0);
  });

  it('restarting replaces previous countdown cleanly', () => {
    const countdown = new CountdownManager({ defaultDuration: 60 });
    countdown.start(30);
    vi.advanceTimersByTime(5000);
    expect(countdown.secondsLeft).toBe(25);

    countdown.start(60);
    expect(countdown.secondsLeft).toBe(60);
    vi.advanceTimersByTime(1000);
    expect(countdown.secondsLeft).toBe(59);
  });
});

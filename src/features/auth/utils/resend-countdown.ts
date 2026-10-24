export interface CountdownOptions {
  readonly defaultDuration?: number;
  readonly onTick?: (secondsLeft: number) => void;
  readonly onComplete?: () => void;
}

export class CountdownManager {
  private _secondsLeft = 0;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private readonly defaultDuration: number;
  private readonly onTick?: (secondsLeft: number) => void;
  private readonly onComplete?: () => void;

  constructor(options: CountdownOptions = {}) {
    this.defaultDuration = options.defaultDuration ?? 60;
    this.onTick = options.onTick;
    this.onComplete = options.onComplete;
  }

  get secondsLeft(): number {
    return this._secondsLeft;
  }

  get isCounting(): boolean {
    return this._secondsLeft > 0;
  }

  get canResend(): boolean {
    return this._secondsLeft === 0;
  }

  start(durationSeconds?: number): void {
    this.reset();
    this._secondsLeft = durationSeconds ?? this.defaultDuration;

    if (this._secondsLeft <= 0) {
      this.onComplete?.();
      return;
    }

    this.timerId = setInterval(() => {
      this._secondsLeft -= 1;
      this.onTick?.(this._secondsLeft);

      if (this._secondsLeft <= 0) {
        this.reset();
        this.onComplete?.();
      }
    }, 1000);
  }

  reset(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this._secondsLeft = 0;
  }

  destroy(): void {
    this.reset();
  }
}

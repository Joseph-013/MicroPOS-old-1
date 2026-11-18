import {
  BannerConfig,
  BannerDurationPreset,
  BannerMessage,
  DURATION_MAP,
  SEVERITY_STYLE_MAP,
} from '@angular-shared';
import { computed, Directive, signal } from '@angular/core';

@Directive()
export abstract class AbstractBannerService {
  protected readonly queue = signal<BannerMessage[]>([]);
  protected readonly timerRegistry = new Map<string, any>();

  readonly activeBanner = computed<BannerMessage | null>(() => {
    const currentQueue = this.queue();
    if (currentQueue.length === 0) return null;

    const temporaryMessages = currentQueue.filter((m) => m.duration > 0);
    const persistentMessages = currentQueue.filter((m) => m.duration === 0);

    if (temporaryMessages.length > 0) {
      return temporaryMessages[0];
    }
    return persistentMessages.length > 0 ? persistentMessages[0] : null;
  });

  public show(config: BannerConfig): string {
    const id = `msg_${crypto.randomUUID()}`;

    const { message, severity = 'info', duration } = config;

    const newMessage: BannerMessage = {
      id,
      message,
      severity,
      duration: this.resolveDuration(duration),
      style: SEVERITY_STYLE_MAP[severity],
    };

    this.queue.update((current) => [...current, newMessage]);

    if (newMessage.duration > 0) {
      const timerToken = setTimeout(() => {
        this.dismiss(id);
      }, newMessage.duration);

      this.timerRegistry.set(id, timerToken);
    }

    return id;
  }

  protected resolveDuration(durationInput?: number | BannerDurationPreset): number {
    if (durationInput === undefined) {
      return DURATION_MAP['default'];
    }
    if (typeof durationInput === 'string') {
      return DURATION_MAP[durationInput] ?? DURATION_MAP['default'];
    }
    return durationInput;
  }

  public dismiss(id: string): void {
    if (this.timerRegistry.has(id)) {
      clearTimeout(this.timerRegistry.get(id));
      this.timerRegistry.delete(id);
    }
    this.queue.update((current) => current.filter((msg) => msg.id !== id));
  }

  public clear(): void {
    this.timerRegistry.forEach((timer) => clearTimeout(timer));
    this.timerRegistry.clear();
    this.queue.set([]);
  }
}

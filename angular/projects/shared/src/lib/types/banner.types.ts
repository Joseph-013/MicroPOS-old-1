export type BannerSeverity = 'info' | 'warning' | 'error' | 'success';

export type BannerDurationPreset = 'short' | 'default' | 'long' | 'xlong';

export interface BannerMessage {
  id: string;
  message: string;
  severity: BannerSeverity;
  duration: number;
  style: string;
}

export const DURATION_MAP: Record<BannerDurationPreset, number> = {
  short: 800,
  default: 1500,
  long: 2000,
  xlong: 3500,
};

export interface BannerConfig {
  message: string;
  severity?: BannerSeverity;
  duration?: number | BannerDurationPreset;
}

export const SEVERITY_STYLE_MAP: Record<BannerSeverity, string> = {
  info: 'bg-background text-foreground',
  warning: 'bg-amber-500 text-white',
  error: 'bg-red-500 text-white',
  success: 'bg-emerald-500 text-white',
};

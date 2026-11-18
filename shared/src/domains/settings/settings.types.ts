export interface Setting<T = unknown> {
  key: string;
  value: T;
  updatedAt: string;
}

export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}

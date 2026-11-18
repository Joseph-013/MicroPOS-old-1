export {};

declare global {
  interface Window {
    electronAPI: {
      /**
       * Calls an asynchronous ipcMain query handler and returns a Promise.
       * @param channel - The IPC channel name
       * @param data - Optional data to send to the main process
       * @returns Promise resolving to the response from the main process
       */
      invoke<TResponse = unknown>(channel: string, data?: unknown): Promise<TResponse>;

      /**
       * Listens to downstream events sent from the Main process.
       * @param channel - The IPC channel name
       * @param callback - Handler invoked when the channel receives data
       * @returns Function to unsubscribe from the channel
       */
      on<TData = unknown>(channel: string, callback: (data: TData) => void): () => void;

      /**
       * Sends a fire-and-forget command to ipcMain.
       * @param channel - The IPC channel name
       * @param data - Optional data to send to the main process
       */
      send<TData = unknown>(channel: string, data?: TData): void;
    };
  }
}

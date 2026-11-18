import { BrowserWindow, ipcMain, IpcMainEvent, IpcMainInvokeEvent } from "electron";

export class MainIPC {
  // ==========================================
  // 1. ASYNCHRONOUS QUERIES (INVOKE / HANDLE)
  // ==========================================

  /**
   * Registers an asynchronous functional worker that safely resolves data demands.
   */
  static handleQuery(channel: string, handler: (event: IpcMainInvokeEvent, data: any) => Promise<any> | any): void {
    // Cleanly removes previous handlers on the same channel to avoid Collision Errors
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, (event, data) => handler(event, data));
  }

  /**
   * Tears down an active query handler channel.
   */
  static removeQueryHandler(channel: string): void {
    ipcMain.removeHandler(channel);
  }

  // ==========================================
  // 2. FIRE-AND-FORGET COMMANDS (ON / OFF / ONCE)
  // ==========================================

  /**
   * Sets up a persistent listener to receive fire-and-forget commands from the UI layout.
   */
  static handleCommand(channel: string, listener: (event: IpcMainEvent, data: any) => void): void {
    ipcMain.on(channel, listener);
  }

  /**
   * Sets up a listener that handles a command exactly once, then instantly self-destructs.
   */
  static handleCommandOnce(channel: string, listener: (event: IpcMainEvent, data: any) => void): void {
    ipcMain.once(channel, listener);
  }

  /**
   * Unregisters a designated listener reference from a command channel.
   */
  static removeCommandListener(channel: string, listener: (event: IpcMainEvent, data: any) => void): void {
    ipcMain.removeListener(channel, listener);
  }

  /**
   * Wipes all active listeners clear from an entire command channel.
   */
  static removeAllCommandListeners(channel: string): void {
    ipcMain.removeAllListeners(channel);
  }

  // ==========================================
  // 3. SYNCHRONOUS COMMAND RESOLUTIONS
  // ==========================================

  /**
   * Handles traditional synchronous requests where the UI main thread blocks until data returns.
   * Uses event.returnValue under the hood while maintaining strict type boundaries.
   */
  static handleSyncQuery(channel: string, handler: (event: IpcMainEvent, data: any) => any): void {
    ipcMain.on(channel, (event, data) => {
      event.returnValue = handler(event, data);
    });
  }

  // ==========================================
  // 4. DOWNSTREAM EVENTS (MAIN -> RENDERER)
  // ==========================================

  /**
   * Fires an asymmetric event downstream to a designated browser window.
   */
  static sendToWindow(window: BrowserWindow, channel: string, data: any): void {
    if (!window || window.isDestroyed() || !window.webContents) return;

    if (window.webContents.isLoading()) {
      window.webContents.once("did-finish-load", () => {
        if (!window.isDestroyed()) {
          window.webContents.send(channel, data);
        }
      });
    } else {
      window.webContents.send(channel, data);
    }
  }

  /**
   * Broadcasts an asymmetric message down to EVERY open browser window across the app.
   */
  static broadcast(channel: string, data: any): void {
    const windows = BrowserWindow.getAllWindows();
    for (const win of windows) {
      if (!win.isDestroyed() && win.webContents) {
        win.webContents.send(channel, data);
      }
    }
  }
}

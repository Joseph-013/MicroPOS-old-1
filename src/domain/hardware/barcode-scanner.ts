import { BrowserWindow } from "electron";
import { MainIPC } from "../../util/ipc-helpers";

const scannerRuntime = {
  isFeatureEnabled: false,
  speedThresholdMs: 35,
  minimumBufferLength: 6,
};
let lastKeyTime = Date.now();
let scanBuffer: string[] = [];
let timeoutId: NodeJS.Timeout | undefined = undefined;
let isReplaying: boolean = false;

export function initializeBarcodeScannerHandler(mainWindow: BrowserWindow) {
  MainIPC.handleCommand("setKeyboardWedgeScannerStatus", (event, data) => {
    scannerRuntime.isFeatureEnabled = data.status === "on" ? true : false;
    console.log(`${data.status === "on" ? "Enabling" : "Disabling"} scanner runtime.`);
  });

  mainWindow.webContents.on("before-input-event", (event, input) => {
    if (input.type !== "keyDown") return;
    if (!scannerRuntime.isFeatureEnabled) return;
    if (isReplaying) return;

    // Completely skip systemic shortcuts
    if (input.control || input.meta || input.alt) {
      if (scanBuffer.length > 0) {
        clearTimeout(timeoutId);
        const currentBuffer = [...scanBuffer];
        scanBuffer = [];
        for (const char of currentBuffer) replayCharacterToUI(mainWindow, char);
      }
      return;
    }

    if (["Shift", "CapsLock"].includes(input.key)) return;

    const timeDifference = Date.now() - lastKeyTime;
    lastKeyTime = Date.now();

    const isFastOrFirst = timeDifference < scannerRuntime.speedThresholdMs || scanBuffer.length === 0;

    if (isFastOrFirst && (input.key === "Enter" || isBarcodeCharacter(input))) {
      if (input.key === "Enter") {
        if (scanBuffer.length === 0) return;
        event.preventDefault();
        const barcodeString = scanBuffer.join("");
        MainIPC.sendToWindow(mainWindow, "onBarcodeScanned", { source: "hid", barcode: barcodeString });
        clearTimeout(timeoutId);
        scanBuffer = [];
        return;
      }

      event.preventDefault();
      scanBuffer.push(input.key);
      clearTimeout(timeoutId);

      timeoutId = setTimeout(() => {
        clearTimeout(timeoutId);
        timeoutId = undefined;

        if (scanBuffer.length < scannerRuntime.minimumBufferLength) {
          const currentBuffer = [...scanBuffer];
          scanBuffer = [];
          for (const char of currentBuffer) {
            replayCharacterToUI(mainWindow, char);
          }
        } else {
          MainIPC.sendToWindow(mainWindow, "onBarcodeScanned", { source: "hid", barcode: scanBuffer.join("") });
        }

        scanBuffer = [];
      }, scannerRuntime.speedThresholdMs);
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      if (scanBuffer.length > 0) {
        const currentBuffer = [...scanBuffer];
        scanBuffer = [];
        for (const char of currentBuffer) {
          replayCharacterToUI(mainWindow, char);
        }
      }
    }
  });
}

function isBarcodeCharacter(input: Electron.Input): boolean {
  const { key } = input;

  if (["Shift", "CapsLock", "Control", "Alt", "Meta", "Backspace", "ArrowLeft", "ArrowRight"].includes(key)) {
    return false;
  }

  if (key === "Enter") return true;
  if (key.length !== 1) return false;

  return /^[a-zA-Z0-9 $%*+\-./:@_]$/.test(key);
}

function replayCharacterToUI(window: BrowserWindow, character: string) {
  isReplaying = true;

  window.webContents.sendInputEvent({
    type: "keyDown",
    keyCode: character,
  });

  window.webContents.sendInputEvent({
    type: "char",
    keyCode: character,
  });

  window.webContents.sendInputEvent({
    type: "keyUp",
    keyCode: character,
  });

  isReplaying = false;
}

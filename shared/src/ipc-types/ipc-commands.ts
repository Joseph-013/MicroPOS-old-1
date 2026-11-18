import { KeyboardWedgeScanner } from "../types/keyboard-wedge-scanner";

export interface IpcCommands {
  setActiveHID: {
    vendorId: number;
    productId: number;
  };
  setKeyboardWedgeScannerStatus: {
    status: KeyboardWedgeScanner["status"];
  };
}

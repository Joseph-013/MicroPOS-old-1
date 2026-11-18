// export * from "./ipc-queries";
// export * from "./ipc-commands";
// export * from "./ipc-events-downstream";

import { SalesOrderItem } from "../domains";

export interface ApiResponse<T = unknown, K = any> {
  status: number;
  data?: T;
  error?: K;
}

// export type ReceiptPayload = {
//   tableData: SalesOrderItem[];
//   grandTotal: number;
//   datetimeISO: string;
// };

// /**
//  * datetimeISO
//  * tableData
//  *    salesorderitem[]
//  *    total
//  * orderNumberURI
//  */

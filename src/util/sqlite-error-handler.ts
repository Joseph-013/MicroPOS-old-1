import { ApiResponse, EntityWriteErrorResponse } from "@shared/src";
import { SqliteError } from "better-sqlite3"; // Explicitly ensure your driver import is tied here

/**
 * Parses raw better-sqlite3 database exceptions into structural unified ApiResponses.
 */
export function parseSqliteError(
  error: unknown,
  fieldToLabelMap: Record<string, string>,
): ApiResponse<never, EntityWriteErrorResponse> {
  // 💡 FIX: Check for the actual native driver runtime exception class
  if (error instanceof SqliteError) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE" || error.message.includes("UNIQUE constraint failed")) {
      // Parse out the failing column key path (handles formats like "items.barcode" or plain "barcode")
      const match = error.message.match(/UNIQUE constraint failed: (?:.+\.)?(.+)/);
      const columnName = match ? match[1] : "";

      const fieldLabel = fieldToLabelMap[columnName] || columnName || "Field";

      return {
        status: 409, // Conflict status boundary
        error: {
          message: `${fieldLabel} must be unique. This value already exists.`,
          field: columnName,
        },
      };
    }
  }

  // Pure fallback protection for unexpected runtime crashes
  return {
    status: 500,
    error: {
      message: error instanceof Error ? error.message : "An unexpected database error occurred.",
    },
  };
}

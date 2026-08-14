import type{ SheetsResponse, SheetMeta } from "../types/sheet.types";

const BASE_URL = "http://localhost:5000/api";

export async function getSheets(): Promise<SheetMeta[]> {
  const res = await fetch(`${BASE_URL}/sheets`);

  if (!res.ok) {
    throw new Error(`Failed to fetch sheets: ${res.status}`);
  }

  const data: SheetsResponse = await res.json();

  if (!data.success) {
    throw new Error("Backend returned success: false for /api/sheets");
  }

  return data.sheets;
}
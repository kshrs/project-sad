export interface SheetMeta {
  sheetName: string;
  totalItems: number;
}

export interface SheetsResponse {
  success: boolean;
  count: number;
  sheets: SheetMeta[];
}
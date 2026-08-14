import api from './apiClient';

interface SheetMeta {
    sheetName: string;
    totalItems: number;
}

interface SheetsMetadataResponse {
    success?: boolean;
    sheets: SheetMeta[];
}

interface SheetEntriesResponse<T = any> {
    success?: boolean;
    sheetName: string;
    entries: T[];
}

// Exporting types using the 'as' keyword
export type {
    SheetMeta,
    SheetMeta as sheetMeta,
    SheetsMetadataResponse,
    SheetsMetadataResponse as SheetsMetaResponse,
    SheetEntriesResponse,
    SheetEntriesResponse as SheetEntryResponse
};

// Get all the sheets metadata available for the specified month
export const getSheetsMetadataByMonth = async (monthId?: string): Promise<SheetsMetadataResponse> => {
    const response = await api.get(`/sheets`, { params: { month_id: monthId } });
    return response.data;
};

// Get all rows of the sheet mentioned
export const getSheetEntriesByMonth = async (sheetName: string, monthId: string): Promise<SheetEntriesResponse> => {
    const response = await api.get(`/sheets-entry/${sheetName}/month/${monthId}`);
    return response.data;
};



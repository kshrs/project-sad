import api from './apiClient';

export interface SheetMeta {
    sheetName: string;
    totalItems: number;
}

export interface SheetsResponse {
    success: boolean;
    count: number;
    sheets: SheetMeta[];
}

// Get all the sheets metadata available for the specified month
export const getSheetsMetadataByMonth = async (monthId?: string) => {
    const requestConfig = monthId ? { params: { month_id: monthId } } : {};
    const response = await api.get('/sheets', requestConfig);
    return response.data as SheetsResponse;
};

// Get all rows of the sheet mentioned
export const getSheetEntriesByMonth = async (sheetName: string, monthId: string) => {
    const response = await api.get(`/sheets-entry/${sheetName}/month/${monthId}`);
    return response.data;
};


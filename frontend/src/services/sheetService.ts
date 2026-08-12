import api from './apiClient';

// Get all the sheets metadata available for the specified month
export const getSheetsMetadataByMonth = async (monthId: string) => {
    const response = await api.get(`/sheets`, { params: { month_id: monthId } });
    return response.data;
};

// Get all rows of the sheet mentioned
export const getSheetEntriesByMonth = async (sheetName: string, monthId: string) => {
    const response = await api.get(`/sheets-entry/${sheetName}/month/${monthId}`);
    return response.data;
};

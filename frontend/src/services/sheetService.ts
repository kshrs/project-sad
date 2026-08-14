import api from './apiClient';

interface SheetMeta {
    sheetName: string;
    totalItems: number;
}

interface SheetsMetadataResponse {
    success?: boolean;
    sheets: SheetMeta[];
}

interface SheetEntriesResponse<T = Record<string, any>> {
    success?: boolean;
    count?: number;
    sheetName?: string;
    totalItems?: number;
    data?: T[];
    items?: T[];
    entries?: T[];
}

interface SingleSheetEntryResponse<T = Record<string, any>> {
    success?: boolean;
    data: T;
}

interface ColumnMeta {
    name: string;
    type?: string;
    required?: boolean;
}

interface SheetColumnsResponse {
    success?: boolean;
    sheetName: string;
    columns: (string | ColumnMeta)[];
}

interface FileUploadResponse {
    success?: boolean;
    message?: string;
    file: {
        id: string;
        filename: string;
        originalname: string;
        contentType: string;
        size: number;
    };
}

// Exporting types using the 'as' keyword
export type {
    SheetMeta,
    SheetMeta as sheetMeta,
    SheetsMetadataResponse,
    SheetsMetadataResponse as SheetsMetaResponse,
    SheetEntriesResponse,
    SheetEntriesResponse as SheetEntryResponse,
    SingleSheetEntryResponse,
    ColumnMeta,
    ColumnMeta as columnMeta,
    SheetColumnsResponse,
    SheetColumnsResponse as sheetColumnsResponse,
    FileUploadResponse,
    FileUploadResponse as fileUploadResponse
};

// Get all the sheets metadata available for the specified month
export const getSheetsMetadataByMonth = async (monthId?: string): Promise<SheetsMetadataResponse> => {
    const response = await api.get(`/sheets`, { params: { month_id: monthId } });
    return response.data;
};

// Get all rows of the sheet mentioned for a month
export const getSheetEntriesByMonth = async (sheetName: string, monthId: string): Promise<SheetEntriesResponse> => {
    const response = await api.get(`/sheets-entry/${sheetName}/month/${monthId}`);
    return response.data;
};

// Get items of a specific sheet (supports optional month_id query parameter)
export const getSheetItems = async (sheetName: string, monthId?: string): Promise<SheetEntriesResponse> => {
    const response = await api.get(`/sheets/${sheetName}`, { params: { month_id: monthId } });
    return response.data;
};

// Get the column definitions for a specific sheet
export const getSheetColumns = async (sheetName: string): Promise<SheetColumnsResponse> => {
    const response = await api.get(`/sheets/${sheetName}/columns`);
    return response.data;
};

// Create an entry in a specific sheet
export const createSheetEntry = async (sheetName: string, data: Record<string, any>): Promise<SingleSheetEntryResponse> => {
    const response = await api.post(`/sheets-entry/${sheetName}`, data);
    return response.data;
};

// Update an entry in a specific sheet
export const updateSheetEntry = async (sheetName: string, id: string, data: Record<string, any>): Promise<SingleSheetEntryResponse> => {
    const response = await api.put(`/sheets-entry/${sheetName}/${id}`, data);
    return response.data;
};

// Delete an entry in a specific sheet
export const deleteSheetEntry = async (sheetName: string, id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/sheets-entry/${sheetName}/${id}`);
    return response.data;
};

// Upload a single file to GridFS
export const uploadFile = async (file: File): Promise<FileUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/files/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

// Get GridFS direct view / download URL
export const getFileUrl = (fileId: string): string => {
    const baseURL = api.defaults.baseURL || 'http://localhost:5000/api';
    return `${baseURL}/files/${fileId}`;
};

// Delete a file from GridFS
export const deleteFile = async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
};






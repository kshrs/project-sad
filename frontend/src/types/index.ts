export interface User {
  id: string;
  _id?: string;
  email: string;
  displayName: string;
  role: 'ADMIN' | 'COORDINATOR' | 'STAFF';
  department: string;
  avatarUrl?: string;
}

export interface AcademicYear {
  _id: string;
  yearKey: string;
  displayName: string;
  department: string;
  isActive: boolean;
}

export interface MonthlyReport {
  _id: string;
  yearId: string;
  monthKey: string;
  monthNumber: number;
  monthName: string;
  status: 'ACTIVE' | 'LOCKED' | 'ARCHIVED';
  lockDateIST?: string;
}

export interface ColumnDefinition {
  fieldKey: string;
  label: string;
  type: 'String' | 'Number' | 'Date' | 'Boolean' | 'File';
  required?: boolean;
  options?: string[];
}

export interface SheetDefinition {
  id: string;
  _id?: string;
  sheetKey: string;
  displayName: string;
  category: 'FACULTY' | 'STUDENT' | 'RESEARCH' | 'OUTREACH' | 'GENERAL';
  columnsCount: number;
  totalItems: number;
  isSystemDefault: boolean;
}

export interface SharedSheetItem {
  ruleId: string;
  sheetKey: string;
  sheetName: string;
  category: string;
  owner: {
    id: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
  };
  accessType: 'READ_ONLY' | 'READ_WRITE';
  canViewExisting: boolean;
  canEditExisting: boolean;
  canDeleteExisting: boolean;
  expiresAt: string;
  totalItems: number;
}

export interface SheetEntry {
  id: string;
  _id?: string;
  sheetId: string;
  sheetKey: string;
  monthId: string;
  ownerId: string;
  createdBy: string;
  data: Record<string, any>;
  version: number;
  __v?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActiveCollaborator {
  userId: string;
  displayName: string;
  email: string;
  color: string;
  focusedRowId: string | null;
}

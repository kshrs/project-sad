import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/apiClient';

export interface AcademicYearType {
  _id: string;
  academic_year: string;
  department: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AccessRuleType {
  from_user: string;
  to_user: string;
  permission?: 'READ' | 'WRITE' | 'ADMIN';
}

export interface MonthlyReportType {
  _id: string;
  year_id: string;
  month_name: string;
  month_number: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  access_rules: AccessRuleType[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportContextType {
  years: AcademicYearType[];
  selectedYear: AcademicYearType | null;
  yearId: string | null;
  academicYearName: string;
  monthlyReports: MonthlyReportType[];
  selectedMonth: MonthlyReportType | null;
  monthId: string | null;
  currentMonthName: string;
  loading: boolean;
  error: string | null;
  changeMonth: (monthId: string) => void;
  changeYear: (yearId: string) => Promise<void>;
  refreshYears: () => Promise<void>;
  refreshKey: number;
  triggerRefresh: () => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface ReportProviderProps {
  children: ReactNode;
}

export const ReportProvider: React.FC<ReportProviderProps> = ({ children }) => {
  const [years, setYears] = useState<AcademicYearType[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYearType | null>(null);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReportType[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyReportType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/years');
      const data = res.data;
      
      let availableYears: AcademicYearType[] = data.success ? data.data : [];

      // If no academic year exists yet, automatically create a default academic year
      if (!availableYears || availableYears.length === 0) {
        try {
          const createYearRes = await api.post('/years', {
            academic_year: '2025-2026',
            department: 'Information Technology',
            created_by: 'Admin'
          });
          if (createYearRes.data?.success && createYearRes.data?.data) {
            availableYears = [createYearRes.data.data];
          }
        } catch (createErr) {
          console.warn('Auto-creating default year skipped:', createErr);
        }
      }

      setYears(availableYears);

      if (availableYears.length > 0) {
        const defaultYear = availableYears[0];
        setSelectedYear(defaultYear);
        await loadYearReports(defaultYear._id);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Network error fetching academic years');
      setLoading(false);
    }
  };

  const loadYearReports = async (yearId: string) => {
    try {
      const res = await api.get(`/reports/year/${yearId}`);
      const data = res.data;

      let reports: MonthlyReportType[] = data.success ? data.data : [];

      // If reports for this academic year haven't been seeded yet, auto-create all 12 months
      if (!reports || reports.length === 0) {
        try {
          const seeded = await Promise.all(
            MONTH_NAMES.map(async (name, index) => {
              const r = await api.post('/reports', {
                year_id: yearId,
                month_name: name,
                month_number: index + 1
              });
              return r.data?.data;
            })
          );
          reports = seeded.filter(Boolean);
        } catch (seedErr) {
          console.warn('Auto-seeding 12 monthly reports failed:', seedErr);
        }
      }

      setMonthlyReports(reports);

      const currentMonthIndex = new Date().getMonth();
      const currentMonthName = MONTH_NAMES[currentMonthIndex];

      let activeMonth = reports.find(
        (r) => r.month_name.toLowerCase() === currentMonthName.toLowerCase()
      );

      if (!activeMonth && reports.length > 0) {
        activeMonth = reports[0];
      }

      setSelectedMonth(activeMonth || null);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Network error fetching monthly reports');
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (monthId: string) => {
    const monthObj = monthlyReports.find((r) => r._id === monthId);
    if (monthObj) {
      setSelectedMonth(monthObj);
    }
  };

  const changeYear = async (yearId: string) => {
    const yearObj = years.find((y) => y._id === yearId);
    if (yearObj) {
      setSelectedYear(yearObj);
      setLoading(true);
      await loadYearReports(yearId);
    }
  };

  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const value: ReportContextType = {
    years,
    selectedYear,
    yearId: selectedYear?._id || null,
    academicYearName: selectedYear?.academic_year || '',
    monthlyReports,
    selectedMonth,
    monthId: selectedMonth?._id || null,
    currentMonthName: selectedMonth?.month_name || '',
    loading,
    error,
    changeMonth,
    changeYear,
    refreshYears: fetchYears,
    refreshKey,
    triggerRefresh
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = (): ReportContextType => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};

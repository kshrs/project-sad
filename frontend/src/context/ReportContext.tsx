import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/apiClient';
import { AcademicYear, MonthlyReport } from '../types';

interface ReportContextType {
  years: AcademicYear[];
  selectedYear: AcademicYear | null;
  months: MonthlyReport[];
  selectedMonth: MonthlyReport | null;
  loading: boolean;
  isMonthLocked: boolean;
  isMonthPastOrLocked: (m: MonthlyReport | null) => boolean;
  refreshKey: number;
  triggerRefresh: () => void;
  selectMonth: (monthId: string) => void;
  selectYear: (yearId: string) => void;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [months, setMonths] = useState<MonthlyReport[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  // Fetch Academic Years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        setLoading(true);
        const res = await api.get('/years');
        const list = res.data?.data || [];
        setYears(list);
        if (list.length > 0 && !selectedYear) {
          setSelectedYear(list[0]);
        }
      } catch (err) {
        console.error('Failed to load academic years', err);
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
  }, []);

  // Helper to determine current year-month in Asia/Kolkata (IST)
  const getCurrentMonthKeyIST = (): string => {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit'
      }).formatToParts(new Date());
      const year = parts.find((p) => p.type === 'year')?.value;
      const month = parts.find((p) => p.type === 'month')?.value;
      if (year && month) return `${year}-${month}`;
    } catch (e) {
      // Fallback
    }
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  // Helper: check if a month is in the past relative to current IST month
  const isMonthPastOrLocked = (m: MonthlyReport | null): boolean => {
    if (!m) return false;
    if (m.status === 'LOCKED') return true;
    if (!m.monthKey) return false;
    const currentKey = getCurrentMonthKeyIST();
    return m.monthKey < currentKey;
  };

  // Fetch Months when Selected Year changes
  useEffect(() => {
    if (!selectedYear) return;

    const fetchMonths = async () => {
      try {
        const res = await api.get(`/reports/year/${selectedYear._id}`);
        const mList = res.data?.data || [];
        setMonths(mList);

        if (mList.length > 0) {
          // Default to current month or latest active month
          const currentKey = getCurrentMonthKeyIST();
          const match = mList.find((m: MonthlyReport) => m.monthKey === currentKey) ||
            mList.find((m: MonthlyReport) => m.status === 'ACTIVE') ||
            mList[mList.length - 1];
          setSelectedMonth(match);
        }
      } catch (err) {
        console.error('Failed to load months for year', err);
      }
    };
    fetchMonths();
  }, [selectedYear?._id]);

  const selectMonth = (monthId: string) => {
    const m = months.find((item) => item._id === monthId);
    if (m) setSelectedMonth(m);
  };

  const selectYear = (yearId: string) => {
    const y = years.find((item) => item._id === yearId);
    if (y) setSelectedYear(y);
  };

  const isMonthLocked = isMonthPastOrLocked(selectedMonth);

  return (
    <ReportContext.Provider
      value={{
        years,
        selectedYear,
        months,
        selectedMonth,
        loading,
        isMonthLocked,
        isMonthPastOrLocked,
        refreshKey,
        triggerRefresh,
        selectMonth,
        selectYear
      }}
    >
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used within a ReportProvider');
  return ctx;
};

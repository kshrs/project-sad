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
          const currentMonthNum = new Date().getMonth() + 1;
          const match = mList.find((m: MonthlyReport) => m.monthNumber === currentMonthNum) || mList[0];
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

  const isMonthLocked = selectedMonth?.status === 'LOCKED';

  return (
    <ReportContext.Provider
      value={{
        years,
        selectedYear,
        months,
        selectedMonth,
        loading,
        isMonthLocked,
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

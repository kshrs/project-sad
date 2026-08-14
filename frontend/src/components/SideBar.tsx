import React, { useEffect, useState } from 'react';
import type { SheetMeta } from '../services/sheetService';
import { getSheetsMetadataByMonth } from '../services/sheetService';
import { useReport } from '../context/ReportContext';
import './Sidebar.css';

interface Props {
  activeSheet: string | null;
  onSelectSheet: (sheetName: string) => void;
}

export const Sidebar: React.FC<Props> = ({ activeSheet, onSelectSheet }) => {
  const { monthId } = useReport();
  const [sheets, setSheets] = useState<SheetMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSheets = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getSheetsMetadataByMonth(monthId || undefined);
        if (!mounted) return;
        if (res && res.sheets) {
          setSheets(res.sheets);
        } else {
          setSheets([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load sheets');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSheets();

    return () => {
      mounted = false;
    };
  }, [monthId]);

  return (
    <aside className="sidebar" aria-label="Sheets navigation">
      <div className="sidebar-header">Sheets</div>

      {loading && <div className="sidebar-loading">Loading...</div>}
      {error && <div className="sidebar-error">{error}</div>}

      <ul className="sheets-list">
        {sheets.map((s) => (
          <li key={s.sheetName}>
            <button
              className={"sheet-btn " + (activeSheet === s.sheetName ? 'active' : '')}
              onClick={() => onSelectSheet(s.sheetName)}
            >
              <span className="sheet-name">{s.sheetName}</span>
              <span className="sheet-count">{s.totalItems}</span>
            </button>
          </li>
        ))}

        {sheets.length === 0 && !loading && (
          <li className="empty">No sheets available</li>
        )}
      </ul>
    </aside>
  );
};

export default Sidebar;

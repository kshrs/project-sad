import React, { useEffect, useState } from 'react';
import { getSheetEntriesByMonth } from '../services/sheetService';
import './SheetTable.css';

interface Props {
  sheetName: string | null;
  monthId: string | null;
}

export const SheetTable: React.FC<Props> = ({ sheetName, monthId }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchRows = async () => {
      if (!sheetName || !monthId) {
        setRows([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const res = await getSheetEntriesByMonth(sheetName, monthId);
        if (!mounted) return;
        if (res && Array.isArray(res.data)) {
          setRows(res.data);
        } else if (res && Array.isArray(res)) {
          setRows(res);
        } else {
          setRows([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load sheet entries');
        setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRows();

    return () => { mounted = false; };
  }, [sheetName, monthId]);

  if (!sheetName) {
    return <div className="sheet-table-placeholder">Select a sheet to view its entries.</div>;
  }

  if (!monthId) {
    return <div className="sheet-table-placeholder">No month selected.</div>;
  }

  if (loading) return <div className="sheet-table-loading">Loading entries...</div>;
  if (error) return <div className="sheet-table-error">{error}</div>;

  if (!rows || rows.length === 0) {
    return <div className="sheet-table-empty">No entries found for <strong>{sheetName}</strong> in this month.</div>;
  }

  // derive columns from first row
  const columns = Object.keys(rows[0]).filter(k => !['_id','__v'].includes(k));

  return (
    <div className="sheet-table-wrapper">
      <h2 className="sheet-title">{sheetName}</h2>
      <div className="table-scroll">
        <table className="sheet-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id || Math.random()}>
                {columns.map((c) => (
                  <td key={c}>{formatCell(r[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function formatCell(value: any) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toLocaleDateString();
  // handle Mongo ObjectId-like objects
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.toString) return String(value);
    return JSON.stringify(value);
  }
  return String(value);
}

export default SheetTable;

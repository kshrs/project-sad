import { useEffect, useMemo, useState } from "react";
import {
    getSheetData,
    type SheetRow
} from "../services/SheetService";

import "./SheetViewer.css";

type SheetViewerProps = {
    sheetName: string;
    displayName?: string;
    monthId: string;
};

function formatColumnName(column: string): string {
    return column
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatValue(value: unknown): string {

    if (value === null || value === undefined) {
        return "-";
    }

    if (typeof value === "object") {
        return JSON.stringify(value);
    }

    return String(value);
}

function SheetViewer({
    sheetName,
    displayName,
    monthId
}: SheetViewerProps) {

    const [data, setData] = useState<SheetRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [searchText, setSearchText] = useState("");

    /*
     * Fetch the COMPLETE sheet.
     */
    const fetchSheet = async () => {

        setLoading(true);
        setError("");

        try {

            const result = await getSheetData(
                sheetName,
                monthId
            );

            /*
             * result contains ALL rows returned
             * by the backend.
             */

            setData(result);

        } catch (err) {

            setData([]);

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Unable to load sheet data.");
            }

        } finally {

            setLoading(false);

        }
    };


    /*
     * Automatically fetch when the selected
     * sheet or month changes.
     */
    useEffect(() => {

        if (monthId) {
            fetchSheet();
        }

    }, [sheetName, monthId]);


    /*
     * IMPORTANT:
     *
     * Get columns from EVERY row rather than
     * only data[0].
     *
     * This guarantees that a column appearing
     * in any returned row is included.
     */
    const columns = useMemo(() => {

        const columnSet = new Set<string>();

        data.forEach((row) => {

            Object.keys(row).forEach((column) => {
                columnSet.add(column);
            });

        });

        return Array.from(columnSet);

    }, [data]);


    /*
     * Search through the complete dataset.
     *
     * This does NOT remove data from the
     * original dataset. It only filters
     * what is currently displayed.
     */
    const filteredData = useMemo(() => {

        const query = searchText
            .trim()
            .toLowerCase();

        if (!query) {
            return data;
        }

        return data.filter((row) => {

            return columns.some((column) => {

                const value = formatValue(row[column]);

                return value
                    .toLowerCase()
                    .includes(query);

            });

        });

    }, [data, columns, searchText]);


    return (

        <div className="sheet-viewer">

            {/* HEADER */}

            <div className="sheet-header">

                <div>

                    <h2>
                        {displayName || sheetName}
                    </h2>

                    <p>
                        {data.length} total row
                        {data.length !== 1 ? "s" : ""}

                        {" • "}

                        {columns.length} column
                        {columns.length !== 1 ? "s" : ""}
                    </p>

                </div>


                <button
                    className="refresh-button"
                    onClick={fetchSheet}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Refresh"}
                </button>

            </div>


            {/* SEARCH */}

            {!loading && !error && data.length > 0 && (

                <div className="table-toolbar">

                    <input
                        type="text"
                        placeholder="Search entire sheet..."
                        value={searchText}
                        onChange={(event) =>
                            setSearchText(event.target.value)
                        }
                        className="sheet-search"
                    />

                    <span className="result-count">

                        Showing {filteredData.length} of {data.length} rows

                    </span>

                </div>

            )}


            {/* LOADING */}

            {loading && (

                <div className="sheet-message">

                    <div className="loading-spinner"></div>

                    <p>
                        Fetching complete sheet data...
                    </p>

                </div>

            )}


            {/* ERROR */}

            {!loading && error && (

                <div className="sheet-error">

                    <strong>
                        Unable to load sheet
                    </strong>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={fetchSheet}
                        className="retry-button"
                    >
                        Try Again
                    </button>

                </div>

            )}


            {/* EMPTY */}

            {!loading &&
                !error &&
                data.length === 0 && (

                    <div className="sheet-message">

                        <p>
                            No records found in this sheet.
                        </p>

                    </div>

                )}


            {/* TABLE */}

            {!loading &&
                !error &&
                data.length > 0 && (

                    <div className="table-container">

                        <table>

                            <thead>

                                <tr>

                                    {columns.map((column) => (

                                        <th key={column}>
                                            {formatColumnName(column)}
                                        </th>

                                    ))}

                                </tr>

                            </thead>


                            <tbody>

                                {filteredData.map(
                                    (row, rowIndex) => (

                                        <tr key={rowIndex}>

                                            {columns.map(
                                                (column) => (

                                                    <td
                                                        key={column}
                                                        title={formatValue(
                                                            row[column]
                                                        )}
                                                    >
                                                        {formatValue(
                                                            row[column]
                                                        )}
                                                    </td>

                                                )
                                            )}

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>


                        {filteredData.length === 0 && (

                            <div className="no-results">

                                No matching records found.

                            </div>

                        )}

                    </div>

                )}

        </div>

    );
}

export default SheetViewer;
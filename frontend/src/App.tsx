import { useState } from "react";
import SheetViewer from "./components/SheetViewer";
import "./App.css";

function App() {
    const [selectedField, setSelectedField] = useState<string | null>(null);

    const monthId = "YOUR_MONTH_ID";

    return (
        <div className="app-layout">

            {/* Left Field Container */}
            <aside className="field-panel">

                <div className="field-search">
                    <input
                        type="text"
                        placeholder="Search fields..."
                    />
                </div>

                <div className="field-list">

                    <button
                        className={`field-button ${
                            selectedField === "field1" ? "active" : ""
                        }`}
                        onClick={() => setSelectedField("field1")}
                    >
                        field 1
                    </button>

                    <button
                        className="field-button disabled"
                        disabled
                    >
                        field 2
                    </button>

                    <button
                        className="field-button disabled"
                        disabled
                    >
                        field 3
                    </button>

                    <button
                        className="field-button disabled"
                        disabled
                    >
                        field 4
                    </button>

                </div>

                <button className="add-button">
                    add
                </button>

            </aside>

            {/* Right Sheet Display */}
            <main className="sheet-area">

                {selectedField === "field1" ? (
                    <SheetViewer
                        sheetName="StudentCareerExams"
                        monthId={monthId}
                    />
                ) : (
                    <div className="empty-state">
                        Select field 1 to view the Student Career Exams sheet.
                    </div>
                )}

            </main>

        </div>
    );
}

export default App;
import { useState } from "react";
import  { Sidebar } from "../components/Sidebar";
import  { SheetTable } from "../components/SheetTable";
import { useReport } from "../context/ReportContext";
import "./DashboardLayout.css";

function DashboardLayout() {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const { monthId } = useReport();

  return (
    <div className="dashboard-layout">
      <Sidebar activeSheet={activeSheet} onSelectSheet={setActiveSheet} />

      <main className="main-content" role="main">
        <SheetTable sheetName={activeSheet} monthId={monthId} />
      </main>
    </div>
  );
}

export default DashboardLayout;
import { useState, useEffect } from "react";
import { DashboardGrid } from "./dashboard-grid";

export function DashboardContent() {
  const [savedLayout, setSavedLayout] = useState(null);

  // Load saved dashboard layout
  useEffect(() => {
    const layout = localStorage.getItem("dashboard-layout");
    if (layout) {
      try {
        setSavedLayout(JSON.parse(layout));
      } catch {
        console.warn("Invalid dashboard layout in localStorage, clearing...");
        localStorage.removeItem("dashboard-layout");
      }
    }
  }, []);

  const handleLayoutChange = (layout: any) => {
    setSavedLayout(layout);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <DashboardGrid onLayoutChange={handleLayoutChange} savedLayout={savedLayout} />
    </div>
  );
}

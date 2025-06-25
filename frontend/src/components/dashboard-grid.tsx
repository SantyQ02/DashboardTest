import React, { useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/layout/card";
import { Button } from "./ui/base/button";
import {
  Users,
  CreditCard,
  Building2,
  Tag,
  Gift,
  Store,
  TrendingUp,
  BarChart3,
  Save,
  RotateCcw,
  Settings,
} from "lucide-react";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardWidget {
  id: string;
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative";
  icon: React.ReactNode;
  color: string;
}

interface DashboardGridProps {
  onLayoutChange?: (layout: any) => void;
  savedLayout?: any;
}

export function DashboardGrid({ onLayoutChange, savedLayout }: DashboardGridProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [widgets] = useState<DashboardWidget[]>([
    {
      id: "users",
      title: "Total Users",
      value: "2,847",
      change: "+12.3%",
      changeType: "positive",
      icon: <Users className="w-6 h-6" />,
      color: "bg-blue-500",
    },
    {
      id: "cards",
      title: "Active Cards",
      value: "1,234",
      change: "+8.7%",
      changeType: "positive",
      icon: <CreditCard className="w-6 h-6" />,
      color: "bg-green-500",
    },
    {
      id: "banks",
      title: "Partner Banks",
      value: "28",
      change: "+3 new",
      changeType: "positive",
      icon: <Building2 className="w-6 h-6" />,
      color: "bg-purple-500",
    },
    {
      id: "categories",
      title: "Categories",
      value: "52",
      change: "+7 added",
      changeType: "positive",
      icon: <Tag className="w-6 h-6" />,
      color: "bg-orange-500",
    },
    {
      id: "offers",
      title: "Active Offers",
      value: "156",
      change: "-2.1%",
      changeType: "negative",
      icon: <Gift className="w-6 h-6" />,
      color: "bg-pink-500",
    },
    {
      id: "stores",
      title: "Partner Stores",
      value: "487",
      change: "+15.2%",
      changeType: "positive",
      icon: <Store className="w-6 h-6" />,
      color: "bg-indigo-500",
    },
    {
      id: "revenue",
      title: "Monthly Revenue",
      value: "$78,456",
      change: "+23.8%",
      changeType: "positive",
      icon: <TrendingUp className="w-6 h-6" />,
      color: "bg-emerald-500",
    },
    {
      id: "transactions",
      title: "Total Transactions",
      value: "34,892",
      change: "+18.5%",
      changeType: "positive",
      icon: <BarChart3 className="w-6 h-6" />,
      color: "bg-cyan-500",
    },
  ]);

  const [layouts, setLayouts] = useState(
    savedLayout || {
      lg: [
        { i: "users", x: 0, y: 0, w: 3, h: 1 },
        { i: "cards", x: 3, y: 0, w: 3, h: 1 },
        { i: "banks", x: 6, y: 0, w: 3, h: 1 },
        { i: "categories", x: 9, y: 0, w: 3, h: 1 },
        { i: "offers", x: 0, y: 1, w: 3, h: 1 },
        { i: "stores", x: 3, y: 1, w: 3, h: 1 },
        { i: "revenue", x: 6, y: 1, w: 3, h: 1 },
        { i: "transactions", x: 9, y: 1, w: 3, h: 1 },
      ],
      md: [
        { i: "users", x: 0, y: 0, w: 6, h: 1 },
        { i: "cards", x: 6, y: 0, w: 6, h: 1 },
        { i: "banks", x: 0, y: 1, w: 6, h: 1 },
        { i: "categories", x: 6, y: 1, w: 6, h: 1 },
        { i: "offers", x: 0, y: 2, w: 6, h: 1 },
        { i: "stores", x: 6, y: 2, w: 6, h: 1 },
        { i: "revenue", x: 0, y: 3, w: 6, h: 1 },
        { i: "transactions", x: 6, y: 3, w: 6, h: 1 },
      ],
      sm: [
        { i: "users", x: 0, y: 0, w: 12, h: 1 },
        { i: "cards", x: 0, y: 1, w: 12, h: 1 },
        { i: "banks", x: 0, y: 2, w: 12, h: 1 },
        { i: "categories", x: 0, y: 3, w: 12, h: 1 },
        { i: "offers", x: 0, y: 4, w: 12, h: 1 },
        { i: "stores", x: 0, y: 5, w: 12, h: 1 },
        { i: "revenue", x: 0, y: 6, w: 12, h: 1 },
        { i: "transactions", x: 0, y: 7, w: 12, h: 1 },
      ],
    },
  );

  const handleLayoutChange = (_: any, allLayouts: any) => {
    setLayouts(allLayouts);
    if (onLayoutChange) {
      onLayoutChange(allLayouts);
    }
  };

  const handleSaveLayout = () => {
    localStorage.setItem("dashboard-layout", JSON.stringify(layouts));
    setIsEditMode(false);
  };

  const handleResetLayout = () => {
    const defaultLayout = {
      lg: [
        { i: "users", x: 0, y: 0, w: 3, h: 1 },
        { i: "cards", x: 3, y: 0, w: 3, h: 1 },
        { i: "banks", x: 6, y: 0, w: 3, h: 1 },
        { i: "categories", x: 9, y: 0, w: 3, h: 1 },
        { i: "offers", x: 0, y: 1, w: 3, h: 1 },
        { i: "stores", x: 3, y: 1, w: 3, h: 1 },
        { i: "revenue", x: 6, y: 1, w: 3, h: 1 },
        { i: "transactions", x: 9, y: 1, w: 3, h: 1 },
      ],
      md: [
        { i: "users", x: 0, y: 0, w: 6, h: 1 },
        { i: "cards", x: 6, y: 0, w: 6, h: 1 },
        { i: "banks", x: 0, y: 1, w: 6, h: 1 },
        { i: "categories", x: 6, y: 1, w: 6, h: 1 },
        { i: "offers", x: 0, y: 2, w: 6, h: 1 },
        { i: "stores", x: 6, y: 2, w: 6, h: 1 },
        { i: "revenue", x: 0, y: 3, w: 6, h: 1 },
        { i: "transactions", x: 6, y: 3, w: 6, h: 1 },
      ],
      sm: [
        { i: "users", x: 0, y: 0, w: 12, h: 1 },
        { i: "cards", x: 0, y: 1, w: 12, h: 1 },
        { i: "banks", x: 0, y: 2, w: 12, h: 1 },
        { i: "categories", x: 0, y: 3, w: 12, h: 1 },
        { i: "offers", x: 0, y: 4, w: 12, h: 1 },
        { i: "stores", x: 0, y: 5, w: 12, h: 1 },
        { i: "revenue", x: 0, y: 6, w: 12, h: 1 },
        { i: "transactions", x: 0, y: 7, w: 12, h: 1 },
      ],
    };
    setLayouts(defaultLayout);
    localStorage.removeItem("dashboard-layout");
    if (onLayoutChange) {
      onLayoutChange(null);
    }
  };

  const renderWidget = (widget: DashboardWidget) => (
    <Card key={widget.id} className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {widget.title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${widget.color} text-white`}>{widget.icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{widget.value}</div>
        {widget.change && (
          <p
            className={`text-xs ${
              widget.changeType === "positive" ? "text-green-600" : "text-red-600"
            }`}
          >
            {widget.change} from last month
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your SaveApp administration panel
          </p>
        </div>
        <div className="flex gap-2">
          {isEditMode ? (
            <>
              <Button onClick={handleSaveLayout}>
                <Save className="w-4 h-4 mr-2" />
                Save Layout
              </Button>
              <Button variant="outline" onClick={handleResetLayout}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Layout
              </Button>
              <Button variant="outline" onClick={() => setIsEditMode(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleResetLayout}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Layout
              </Button>
              <Button onClick={() => setIsEditMode(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Layout
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 6, xxs: 2 }}
        rowHeight={120}
        onLayoutChange={handleLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {widgets.map((widget) => (
          <div key={widget.id}>{renderWidget(widget)}</div>
        ))}
      </ResponsiveGridLayout>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart placeholder - Recent activity data
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              Chart placeholder - Top categories data
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Users className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <CreditCard className="w-6 h-6" />
              <span>Add Card</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Gift className="w-6 h-6" />
              <span>Create Offer</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Store className="w-6 h-6" />
              <span>Add Store</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

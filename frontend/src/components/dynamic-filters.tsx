import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/layout/card";
import { Button } from "./ui/base/button";
import { Input } from "./ui/forms/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/forms/select";

import { Label } from "./ui/forms/label";
import { Badge } from "./ui/data-display/badge";
import { Filter, X, ChevronDown, ChevronRight } from "lucide-react";
import { camelToTitleCase } from "../lib/utils";
import type { ColumnConfig } from "../hooks/use-column-config";

interface FilterValue {
  [key: string]: any;
}

interface DynamicFiltersProps {
  columns: ColumnConfig[];
  filters: FilterValue;
  onFiltersChange: (filters: FilterValue) => void;
  onClearFilters: () => void;
}

// Componente para filtro de texto
function TextFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
    />
  );
}

// Componente para filtro de email
function EmailFilter({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      type="email"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full"
    />
  );
}

// Componente para filtro de número
function NumberFilter({
  value,
  onChange,
}: {
  value: { min?: number; max?: number };
  onChange: (value: { min?: number; max?: number }) => void;
}) {
  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={value?.min || ""}
        onChange={(e) =>
          onChange({
            ...value,
            min: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        placeholder="Min"
        className="flex-1"
      />
      <Input
        type="number"
        value={value?.max || ""}
        onChange={(e) =>
          onChange({
            ...value,
            max: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        placeholder="Max"
        className="flex-1"
      />
    </div>
  );
}

// Componente para filtro de fecha
function DateFilter({
  value,
  onChange,
}: {
  value: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
}) {
  return (
    <div className="flex gap-2">
      <Input
        type="date"
        value={value?.from || ""}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
        className="flex-1"
      />
      <Input
        type="date"
        value={value?.to || ""}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
        className="flex-1"
      />
    </div>
  );
}

// Componente para filtro boolean
function BooleanFilter({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <Select
      value={value === null ? "all" : value.toString()}
      onValueChange={(val) => {
        if (val === "all") onChange(null);
        else onChange(val === "true");
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="All" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        <SelectItem value="true">Yes</SelectItem>
        <SelectItem value="false">No</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Componente para filtro enum/select
function EnumFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Select
        onValueChange={(val) => {
          if (!value.includes(val)) {
            onChange([...value, val]);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.map((item) => (
            <Badge key={item} variant="secondary" className="text-xs">
              {item}
              <button
                onClick={() => onChange(value.filter((v) => v !== item))}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function DynamicFilters({
  columns,
  filters,
  onFiltersChange,
  onClearFilters,
}: DynamicFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const filterableColumns = columns.filter(
    (col) => col.key !== "id" && !col.key.includes("Id"),
  );

  const hasActiveFilters = Object.keys(filters).some((key) => {
    const value = filters[key];
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") {
      return Object.values(value).some(
        (v) => v !== null && v !== undefined && v !== "",
      );
    }
    return true;
  });

  const activeFiltersCount = Object.keys(filters).filter((key) => {
    const value = filters[key];
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") {
      return Object.values(value).some(
        (v) => v !== null && v !== undefined && v !== "",
      );
    }
    return true;
  }).length;

  const handleFilterChange = (columnKey: string, value: any) => {
    onFiltersChange({
      ...filters,
      [columnKey]: value,
    });
  };

  const renderFilter = (column: ColumnConfig) => {
    const value = filters[column.key];
    const label = column.label || camelToTitleCase(column.key);

    switch (column.type) {
      case "text":
        return (
          <TextFilter
            value={value}
            onChange={(val) => handleFilterChange(column.key, val)}
            placeholder={`Filter by ${label.toLowerCase()}`}
          />
        );

      case "email":
        return (
          <EmailFilter
            value={value}
            onChange={(val) => handleFilterChange(column.key, val)}
            placeholder={`Filter by ${label.toLowerCase()}`}
          />
        );

      case "url":
        return (
          <TextFilter
            value={value}
            onChange={(val) => handleFilterChange(column.key, val)}
            placeholder={`Filter by ${label.toLowerCase()}`}
          />
        );

      case "number":
      case "currency":
        return (
          <NumberFilter
            value={value || {}}
            onChange={(val) => handleFilterChange(column.key, val)}
          />
        );

      case "date":
        return (
          <DateFilter
            value={value || {}}
            onChange={(val) => handleFilterChange(column.key, val)}
          />
        );

      case "boolean":
        return (
          <BooleanFilter
            value={value}
            onChange={(val) => handleFilterChange(column.key, val)}
          />
        );

      case "enum":
        return (
          <EnumFilter
            value={value || []}
            onChange={(val) => handleFilterChange(column.key, val)}
            options={column.enumValues || []}
            placeholder={`Select ${label.toLowerCase()}`}
          />
        );

      default:
        return (
          <TextFilter
            value={value}
            onChange={(val) => handleFilterChange(column.key, val)}
            placeholder={`Filter by ${label.toLowerCase()}`}
          />
        );
    }
  };

  if (filterableColumns.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              disabled
              className="flex items-center gap-2 p-0 h-auto hover:bg-transparent cursor-default"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="flex items-center gap-2 text-base text-muted-foreground">
                <Filter className="w-4 h-4" />
                Advanced Filters
                <Badge variant="outline" className="ml-2">
                  No filterable columns
                </Badge>
              </CardTitle>
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 p-0 h-auto hover:bg-transparent"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              Advanced Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount} active
                </Badge>
              )}
            </CardTitle>
          </Button>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filterableColumns.map((column) => (
              <div key={column.key} className="space-y-2">
                <Label className="text-sm font-medium">
                  {column.label || camelToTitleCase(column.key)}
                </Label>
                {renderFilter(column)}
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

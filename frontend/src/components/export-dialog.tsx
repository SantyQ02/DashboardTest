import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/layout/dialog";
import { Button } from "./ui/base/button";
import { Card, CardContent } from "./ui/layout/card";
import { Checkbox } from "./ui/forms/checkbox";
import { FileDown, AlertCircle, Info } from "lucide-react";
import { Label } from "./ui/forms/label";
import { useDialogCleanup } from "../hooks/useAsync";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, useFilters: boolean) => Promise<void>;
  modelName: string;
  totalRecords: number;
  filteredRecords?: number;
  maxExportLimit?: number;
}

const EXPORT_FORMATS = [
  { value: "json", label: "JSON", description: "JavaScript Object Notation" },
  { value: "csv", label: "CSV", description: "Comma Separated Values" },
  { value: "xml", label: "XML", description: "Extensible Markup Language" },
  { value: "excel", label: "Excel", description: "Microsoft Excel (.xlsx)" },
];

export function ExportDialog({
  isOpen,
  onClose,
  onExport,
  modelName,
  totalRecords,
  filteredRecords,
  maxExportLimit = 10000,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("json");
  const [useFilters, setUseFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dialogCleanup = useDialogCleanup();

  const resetState = () => {
    setSelectedFormat("json");
    setUseFilters(false);
    setIsExporting(false);
  };

  const handleClose = () => {
    resetState();
    dialogCleanup();
    onClose();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat, useFilters);
      handleClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getExportCount = () => {
    const recordsToExport =
      useFilters && filteredRecords !== undefined ? filteredRecords : totalRecords;
    return Math.min(recordsToExport, maxExportLimit);
  };

  const willHitLimit = () => {
    const recordsToExport =
      useFilters && filteredRecords !== undefined ? filteredRecords : totalRecords;
    return recordsToExport > maxExportLimit;
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "json":
        return "{ }";
      case "csv":
        return "📊";
      case "xml":
        return "< >";
      case "excel":
        return "📈";
      default:
        return "📄";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Export {modelName} Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Format Selection */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Export Format</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose the format for your exported data
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {EXPORT_FORMATS.map((format) => (
                    <div
                      key={format.value}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${
                        selectedFormat === format.value
                          ? "border-primary bg-primary/5"
                          : "border-muted"
                      }`}
                      onClick={() => setSelectedFormat(format.value)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getFormatIcon(format.value)}</div>
                        <div className="flex-1">
                          <div className="font-medium">{format.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {format.description}
                          </div>
                        </div>
                        {selectedFormat === format.value && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filter Options */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Export Options</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure what data to export
                  </p>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="use-filters"
                    checked={useFilters}
                    onCheckedChange={(checked) => setUseFilters(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="use-filters" className="cursor-pointer">
                      Apply current filters and search
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Export only the records that match your current table filters
                    </p>
                  </div>
                </div>

                {/* Export Summary */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Export Summary</div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>
                          Total records in database:{" "}
                          <span className="font-medium">
                            {totalRecords.toLocaleString()}
                          </span>
                        </div>
                        {filteredRecords !== undefined &&
                          filteredRecords !== totalRecords && (
                            <div>
                              Filtered records:{" "}
                              <span className="font-medium">
                                {filteredRecords.toLocaleString()}
                              </span>
                            </div>
                          )}
                        <div>
                          Records to export:{" "}
                          <span className="font-medium text-primary">
                            {getExportCount().toLocaleString()}
                          </span>
                        </div>
                        {willHitLimit() && (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm">
                              Export limited to {maxExportLimit.toLocaleString()}{" "}
                              records for performance
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 mr-2" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

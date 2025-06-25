import React, { useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/layout/dialog";
import { Button } from "./ui/base/button";
import { Badge } from "./ui/data-display/badge";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  FileUp,
} from "lucide-react";
import { Card, CardContent } from "./ui/layout/card";
import { useDialogCleanup } from "../hooks/useAsync";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any[], format: string) => Promise<void>;
  modelName: string;
  validateSchema?: (data: any[]) => Promise<{ valid: boolean; errors: string[] }>;
}

interface FileData {
  file: File;
  data: any[] | null;
  format: string;
  isValid: boolean;
  errors: string[];
  isValidating: boolean;
}

export function ImportDialog({
  isOpen,
  onClose,
  onImport,
  modelName,
  validateSchema,
}: ImportDialogProps) {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dialogCleanup = useDialogCleanup();

  const resetState = () => {
    setFileData(null);
    setIsDragOver(false);
    setIsImporting(false);
  };

  const handleClose = () => {
    resetState();
    // Limpiar input file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Limpiar cualquier estado de diálogo problemático
    dialogCleanup();
    onClose();
  };

  const detectFileFormat = (file: File): string => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "json":
        return "json";
      case "csv":
        return "csv";
      case "xml":
        return "xml";
      default:
        return "unknown";
    }
  };

  const parseFileContent = async (file: File, format: string): Promise<any[]> => {
    const text = await file.text();

    switch (format) {
      case "json":
        const jsonData = JSON.parse(text);
        return Array.isArray(jsonData) ? jsonData : [jsonData];

      case "csv":
        const lines = text.trim().split("\n");
        if (lines.length < 2)
          throw new Error("CSV must have at least a header and one data row");

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        const data = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || "";
          });
          return obj;
        });
        return data;

      case "xml":
        // Implementación básica de XML parsing
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const items = Array.from(xmlDoc.getElementsByTagName("item"));

        return items.map((item) => {
          const obj: any = {};
          Array.from(item.children).forEach((child) => {
            obj[child.tagName] = child.textContent;
          });
          return obj;
        });

      default:
        throw new Error("Unsupported file format");
    }
  };

  const validateFile = async (file: File) => {
    const format = detectFileFormat(file);

    if (format === "unknown") {
      setFileData({
        file,
        data: null,
        format,
        isValid: false,
        errors: ["Unsupported file format. Please use JSON, CSV, or XML."],
        isValidating: false,
      });
      return;
    }

    setFileData({
      file,
      data: null,
      format,
      isValid: false,
      errors: [],
      isValidating: true,
    });

    try {
      const data = await parseFileContent(file, format);

      if (data.length === 0) {
        setFileData((prev) =>
          prev
            ? {
                ...prev,
                isValid: false,
                errors: ["File contains no data records"],
                isValidating: false,
              }
            : null,
        );
        return;
      }

      // Validar esquema si se proporciona función de validación
      let validationResult: { valid: boolean; errors: string[] } = {
        valid: true,
        errors: [],
      };
      if (validateSchema) {
        validationResult = await validateSchema(data);
      }

      setFileData((prev) =>
        prev
          ? {
              ...prev,
              data,
              isValid: validationResult.valid,
              errors: validationResult.errors,
              isValidating: false,
            }
          : null,
      );
    } catch (error) {
      setFileData((prev) =>
        prev
          ? {
              ...prev,
              isValid: false,
              errors: [error instanceof Error ? error.message : "Failed to parse file"],
              isValidating: false,
            }
          : null,
      );
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateFile(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateFile(files[0]);
    }
  };

  const handleImport = async () => {
    if (!fileData || !fileData.data || !fileData.isValid) return;

    setIsImporting(true);
    try {
      await onImport(fileData.data, fileData.format);
      handleClose();
    } catch (error) {
      console.error("Import failed:", error);
    } finally {
      setIsImporting(false);
    }
  };

  const getStatusIcon = () => {
    if (!fileData) return null;

    if (fileData.isValidating) {
      return <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }

    if (fileData.isValid) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }

    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (!fileData) return "";

    if (fileData.isValidating) return "Validating...";
    if (fileData.isValid) return "File is valid and ready to import";
    return "File validation failed";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="w-5 h-5" />
            Import {modelName} Data
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <Card>
            <CardContent className="p-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 rounded-full bg-muted">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-medium">Drag and drop your file here</p>
                    <p className="text-sm text-muted-foreground">
                      or click to browse files
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fileData?.isValidating}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">JSON</Badge>
                    <Badge variant="secondary">CSV</Badge>
                    <Badge variant="secondary">XML</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Status */}
          {fileData && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getStatusIcon()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">{fileData.file.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {fileData.format.toUpperCase()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFileData(null)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">{getStatusText()}</p>
                    {fileData.data && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {fileData.data.length} records found
                      </p>
                    )}
                    {fileData.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {fileData.errors.map((error, index) => (
                          <p key={index} className="text-xs text-red-600">
                            • {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!fileData || !fileData.isValid || isImporting}
              className="min-w-[100px]"
            >
              {isImporting ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <AlertCircle className="w-8 h-8 animate-spin mb-4 text-primary" />
                  <span className="font-bold text-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.csv,.xml"
          onChange={handleFileSelect}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}

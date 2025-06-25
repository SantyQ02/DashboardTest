import { useState } from "react";
import { Button } from "./ui/base/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/layout/sheet";
import { Settings, Eye, EyeOff, GripVertical } from "lucide-react";
import type { ColumnConfig } from "../hooks/use-column-config";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { camelToTitleCase } from "../lib/utils";

// Componente para un item de columna individual que se puede arrastrar
function SortableColumnItem({
  id,
  column,
  isVisible,
  onToggleColumn,
}: {
  id: string;
  column: ColumnConfig;
  isVisible: boolean;
  onToggleColumn: (key: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center space-x-3 p-3 rounded-md bg-muted/50 hover:bg-muted/70 transition-colors"
    >
      {/* Handle para drag */}
      <div {...listeners} className="cursor-grab touch-none p-1">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Botón de visibilidad (ojito) */}
      <Button
        variant="ghost"
        size="sm"
        className="p-1 h-8 w-8"
        onClick={() => onToggleColumn(column.key)}
      >
        {isVisible ? (
          <Eye className="w-4 h-4 text-green-600" />
        ) : (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {/* Nombre de la columna */}
      <div className="flex-grow">
        <span
          className={`text-sm ${isVisible ? "text-foreground font-medium" : "text-muted-foreground"}`}
        >
          {column.label ? column.label : camelToTitleCase(column.key)}
        </span>
      </div>
    </div>
  );
}

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  visibleColumns: string[];
  onToggleColumn: (columnKey: string) => void;
  onSetColumnOrder: (orderedKeys: string[]) => void;
}

export function ColumnSelector({
  columns,
  visibleColumns,
  onToggleColumn,
  onSetColumnOrder,
}: ColumnSelectorProps) {
  const [open, setOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = columns.findIndex((c) => c.key === active.id);
      const newIndex = columns.findIndex((c) => c.key === over.id);
      const newOrder = arrayMove(columns, oldIndex, newIndex);
      onSetColumnOrder(newOrder.map((c) => c.key));
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Columns
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-background flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Customize Columns</SheetTitle>
        </SheetHeader>
        <div className="flex-1 min-h-0 overflow-y-auto mt-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map((c) => c.key)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {columns.map((column) => (
                  <SortableColumnItem
                    key={column.key}
                    id={column.key}
                    column={column}
                    isVisible={visibleColumns.includes(column.key)}
                    onToggleColumn={onToggleColumn}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <div className="sticky bottom-0 left-0 right-0 bg-background pt-4 border-t z-10">
          <div className="text-sm text-muted-foreground space-y-1 px-4 pb-4">
            <p>• Drag the grip handle to reorder columns</p>
            <p>• Click the eye icon to show/hide columns</p>
            <p>• Changes are saved automatically</p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

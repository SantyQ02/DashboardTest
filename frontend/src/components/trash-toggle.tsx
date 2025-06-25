import { Button } from "./ui/base/button";
import { Trash2, Eye } from "lucide-react";

interface TrashToggleProps {
  isViewingTrash: boolean;
  onToggle: () => void;
  count?: number;
}

export function TrashToggle({ isViewingTrash, onToggle, count }: TrashToggleProps) {
  return (
    <Button
      variant={isViewingTrash ? "destructive" : "outline"}
      size="sm"
      onClick={onToggle}
    >
      {isViewingTrash ? (
        <>
          <Eye className="w-4 h-4 mr-2" />
          View Active
        </>
      ) : (
        <>
          <Trash2 className="w-4 h-4 mr-2" />
          View Trash
          {count !== undefined && count > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-muted rounded-full">
              {count}
            </span>
          )}
        </>
      )}
    </Button>
  );
}

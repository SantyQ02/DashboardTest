import { Button } from "./ui/base/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/base/dropdown-menu";
import { MoreHorizontal, Eye, Edit, Trash2, RotateCcw } from "lucide-react";

interface ActionsMenuProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  isViewingTrash?: boolean;
  disabled?: boolean;
}

export function ActionsMenu({
  onView,
  onEdit,
  onDelete,
  onRestore,
  isViewingTrash = false,
  disabled = false,
}: ActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={disabled}>
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {onView && (
          <DropdownMenuItem onClick={onView} className="cursor-pointer">
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
        )}

        {!isViewingTrash && (
          <>
            {onEdit && (
              <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
            )}

            {(onView || onEdit) && onDelete && <DropdownMenuSeparator />}

            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </>
        )}

        {isViewingTrash && onRestore && (
          <DropdownMenuItem onClick={onRestore} className="cursor-pointer">
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

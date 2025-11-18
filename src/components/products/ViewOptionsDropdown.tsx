import { Grid3x3, LayoutGrid, LayoutList, Grid2x2, Rows3 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type ViewMode = "large" | "medium" | "small" | "list" | "compact";

interface ViewOptionsDropdownProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewOptionsDropdown = ({ currentView, onViewChange }: ViewOptionsDropdownProps) => {
  const viewOptions = [
    { value: "large" as ViewMode, label: "Large Thumbnails", icon: LayoutGrid },
    { value: "medium" as ViewMode, label: "Medium Grid", icon: Grid2x2 },
    { value: "small" as ViewMode, label: "Small Grid", icon: Grid3x3 },
    { value: "list" as ViewMode, label: "List View", icon: LayoutList },
    { value: "compact" as ViewMode, label: "Compact Grid", icon: Rows3 },
  ];

  const currentOption = viewOptions.find(opt => opt.value === currentView);
  const CurrentIcon = currentOption?.icon || LayoutGrid;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span className="hidden sm:inline">View</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onViewChange(option.value)}
              className={currentView === option.value ? "bg-accent" : ""}
            >
              <Icon className="h-4 w-4 mr-2" />
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ViewOptionsDropdown;

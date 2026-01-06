import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Maximize2, Check } from "lucide-react";
import { WidgetLayout } from "@/stores/dashboardStore";

interface WidgetSizeMenuProps {
  currentLayout?: WidgetLayout;
  onSizeChange: (colSpan: number) => void;
}

const sizeOptions = [
  { label: "Pequeno", colSpan: 3, description: "1/4 da linha" },
  { label: "Médio", colSpan: 6, description: "1/2 da linha" },
  { label: "Grande", colSpan: 9, description: "3/4 da linha" },
  { label: "Linha inteira", colSpan: 12, description: "Largura total" },
];

export function WidgetSizeMenu({ currentLayout, onSizeChange }: WidgetSizeMenuProps) {
  const currentColSpan = currentLayout?.colSpan ?? 3;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Maximize2 className="h-4 w-4 mr-2" />
        Tamanho
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {sizeOptions.map((option) => (
          <DropdownMenuItem
            key={option.colSpan}
            onClick={() => onSizeChange(option.colSpan)}
            className="flex items-center justify-between"
          >
            <div className="flex flex-col">
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
            {currentColSpan === option.colSpan && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

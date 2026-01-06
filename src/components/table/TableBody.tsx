import { useState, useRef, useEffect, KeyboardEvent, forwardRef } from "react";
import { ColumnDefinition, TableRow } from "@/types";
import { useDataStore } from "@/stores";
import { useProcessStore } from "@/stores/processStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TableBodyProps {
  columns: ColumnDefinition[];
  rows: TableRow[];
  tableId: string;
  editingCell: { rowId: string; columnId: string } | null;
  onCellClick: (rowId: string, columnId: string) => void;
  onCellEdit: (rowId: string, columnId: string, value: unknown) => void;
  onRowClick?: (row: TableRow) => void;
}

interface CellEditorProps {
  column: ColumnDefinition;
  value: unknown;
  row: TableRow;
  tableId: string;
  onSave: (value: unknown) => void;
  onCancel: () => void;
}

const CellEditor = forwardRef<HTMLInputElement, CellEditorProps>(
  ({ column, value, row, tableId, onSave, onCancel }, ref) => {
    const [localValue, setLocalValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const { canChangeSelectField } = useProcessStore();

    useEffect(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, []);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        onSave(localValue);
      } else if (e.key === "Escape") {
        onCancel();
      }
    };

    // Validate select change for deals table
    const handleSelectChange = (newValue: string) => {
      if (tableId === "deals" && column.type === "select") {
        const currentValue = String(value || "");
        
        if (currentValue !== newValue && currentValue) {
          const validation = canChangeSelectField({
            deal: row as unknown as Record<string, unknown>,
            fieldKey: column.id,
            fromValue: currentValue,
            toValue: newValue,
          });

          if (!validation.ok) {
            if (validation.transitionBlocked) {
              toast.error("Transição não permitida", {
                description: validation.message,
                duration: 5000,
              });
            } else {
              toast.error("Não é possível alterar", {
                description: validation.message,
                duration: 5000,
              });
            }
            onCancel();
            return;
          }
        }
      }

      setLocalValue(newValue);
      onSave(newValue);
    };

    switch (column.type) {
      case "text":
        return (
          <Input
            ref={inputRef}
            value={String(localValue || "")}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave(localValue)}
            className="h-8 text-sm"
          />
        );

      case "number":
        return (
          <Input
            ref={inputRef}
            type="number"
            value={Number(localValue) || 0}
            onChange={(e) => setLocalValue(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave(localValue)}
            className="h-8 text-sm"
          />
        );

      case "currency":
        return (
          <Input
            ref={inputRef}
            type="number"
            value={Number(localValue) || 0}
            onChange={(e) => setLocalValue(Number(e.target.value))}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave(localValue)}
            className="h-8 text-sm"
          />
        );

      case "select":
        return (
          <Select
            value={String(localValue || "")}
            onValueChange={handleSelectChange}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "boolean":
        return (
          <Checkbox
            checked={Boolean(localValue)}
            onCheckedChange={(checked) => {
              setLocalValue(checked);
              onSave(checked);
            }}
          />
        );

      case "date":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-sm">
                <CalendarIcon className="mr-2 h-3 w-3" />
                {localValue ? format(new Date(String(localValue)), "PP", { locale: ptBR }) : "Selecionar"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 pointer-events-auto">
              <Calendar
                mode="single"
                selected={localValue ? new Date(String(localValue)) : undefined}
                onSelect={(date) => {
                  if (date) {
                    const iso = date.toISOString();
                    setLocalValue(iso);
                    onSave(iso);
                  }
                }}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        );

      default:
        return (
          <Input
            ref={inputRef}
            value={String(localValue || "")}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => onSave(localValue)}
            className="h-8 text-sm"
          />
        );
    }
  }
);

CellEditor.displayName = "CellEditor";

const CellDisplay = ({ column, value, tableId }: { column: ColumnDefinition; value: unknown; tableId: string }) => {
  const { getCompany, getContact, getUser } = useDataStore();

  // Handle relation type
  if (column.type === "relation") {
    let displayValue = "";
    switch (column.relationTable) {
      case "companies":
        const company = getCompany(String(value));
        displayValue = company?.name || String(value);
        break;
      case "contacts":
        const contact = getContact(String(value));
        displayValue = contact ? `${contact.firstName} ${contact.lastName}` : String(value);
        break;
      case "users":
        const user = getUser(String(value));
        displayValue = user?.name || String(value);
        break;
      default:
        displayValue = String(value);
    }
    return <span className="text-foreground">{displayValue}</span>;
  }

  // Handle other types
  switch (column.type) {
    case "currency":
      return (
        <span className="font-medium text-foreground">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(Number(value) || 0)}
        </span>
      );

    case "date":
      if (!value) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="text-foreground">
          {format(new Date(String(value)), "dd/MM/yyyy", { locale: ptBR })}
        </span>
      );

    case "boolean":
      return (
        <Checkbox checked={Boolean(value)} disabled className="cursor-default" />
      );

    case "select":
      const option = column.options?.find((opt) => opt.value === value);
      if (!option) return <span className="text-muted-foreground">—</span>;
      return (
        <Badge
          variant="secondary"
          style={{ backgroundColor: option.color ? `${option.color}20` : undefined }}
          className="font-medium"
        >
          <span style={{ color: option.color }}>{option.label}</span>
        </Badge>
      );

    case "multi-select":
      const values = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-wrap gap-1">
          {values.map((v) => {
            const opt = column.options?.find((o) => o.value === v);
            return (
              <Badge key={v} variant="secondary" className="text-xs">
                {opt?.label || v}
              </Badge>
            );
          })}
        </div>
      );

    default:
      return <span className="text-foreground">{String(value || "")}</span>;
  }
};

export const TableBody = ({
  columns,
  rows,
  tableId,
  editingCell,
  onCellClick,
  onCellEdit,
  onRowClick,
}: TableBodyProps) => {
  return (
    <tbody>
      {rows.length === 0 ? (
        <tr>
          <td
            colSpan={columns.length}
            className="px-4 py-12 text-center text-muted-foreground"
          >
            Nenhum registro encontrado
          </td>
        </tr>
      ) : (
        rows.map((row) => (
          <tr
            key={row.id}
            className="group border-b border-table-border hover:bg-table-row-hover transition-colors cursor-pointer"
            onClick={() => onRowClick?.(row)}
          >
            {columns.map((column) => {
              const isEditing =
                editingCell?.rowId === row.id &&
                editingCell?.columnId === column.id;
              const value = row[column.id];

              return (
                <td
                  key={column.id}
                  className={cn(
                    "px-4 py-3 text-sm",
                    column.editable && "table-cell-editable",
                    isEditing && "bg-secondary"
                  )}
                  onClick={(e) => {
                    if (column.editable) {
                      e.stopPropagation();
                      onCellClick(row.id, column.id);
                    }
                  }}
                >
                  {isEditing && column.editable ? (
                    <CellEditor
                      column={column}
                      value={value}
                      row={row}
                      tableId={tableId}
                      onSave={(newValue) => onCellEdit(row.id, column.id, newValue)}
                      onCancel={() => onCellClick("", "")}
                    />
                  ) : (
                    <CellDisplay column={column} value={value} tableId={tableId} />
                  )}
                </td>
              );
            })}
          </tr>
        ))
      )}
    </tbody>
  );
};

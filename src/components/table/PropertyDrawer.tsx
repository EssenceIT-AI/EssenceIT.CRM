import { useState, useEffect, useRef } from "react";
import { ColumnDefinition, TableRow } from "@/types";
import { useDataStore } from "@/stores";
import { useProcessStore } from "@/stores/processStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { CalendarIcon, X, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PropertyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  row: TableRow | null;
  columns: ColumnDefinition[];
  onSave: (rowId: string, updates: Record<string, unknown>) => void;
}

interface FieldEditorProps {
  column: ColumnDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  onSelectChange?: (column: ColumnDefinition, newValue: string) => boolean;
  error?: string;
  tableId: string;
}

const FieldEditor = ({ column, value, onChange, onSelectChange, error, tableId }: FieldEditorProps) => {
  const { getCompanies, getContacts, getUsers } = useDataStore();

  const getRelationOptions = () => {
    switch (column.relationTable) {
      case "companies":
        return getCompanies().map((c) => ({ value: c.id, label: c.name }));
      case "contacts":
        return getContacts().map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }));
      case "users":
        return getUsers().map((u) => ({ value: u.id, label: u.name }));
      default:
        return [];
    }
  };

  switch (column.type) {
    case "text":
      if (column.id === "notes" || column.description?.includes("longo")) {
        return (
          <Textarea
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            placeholder={column.description || `Digite ${column.name.toLowerCase()}...`}
            rows={3}
            className={cn(error && "border-destructive")}
          />
        );
      }
      return (
        <Input
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={column.description || `Digite ${column.name.toLowerCase()}...`}
          className={cn(error && "border-destructive")}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={Number(value) || ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
          placeholder="0"
          className={cn(error && "border-destructive")}
        />
      );

    case "currency":
      return (
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            R$
          </span>
          <Input
            type="number"
            value={Number(value) || ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            placeholder="0,00"
            className={cn("pl-9", error && "border-destructive")}
            step="0.01"
          />
        </div>
      );

    case "select":
      return (
        <Select
          value={String(value || "")}
          onValueChange={(val) => {
            // If there's a custom handler for select changes, use it
            if (onSelectChange) {
              const allowed = onSelectChange(column, val);
              if (!allowed) return; // Don't update if blocked
            }
            onChange(val);
          }}
        >
          <SelectTrigger className={cn(error && "border-destructive")}>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            {column.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "multi-select":
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 border rounded-md bg-background">
            {selectedValues.length === 0 && (
              <span className="text-muted-foreground text-sm">Selecione opções...</span>
            )}
            {selectedValues.map((v) => {
              const opt = column.options?.find((o) => o.value === v);
              return (
                <Badge
                  key={v}
                  variant="secondary"
                  className="gap-1 pr-1"
                  style={{ backgroundColor: opt?.color ? `${opt.color}20` : undefined }}
                >
                  <span style={{ color: opt?.color }}>{opt?.label || v}</span>
                  <button
                    onClick={() => onChange(selectedValues.filter((sv) => sv !== v))}
                    className="hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1">
            {column.options
              ?.filter((opt) => !selectedValues.includes(opt.value))
              .map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange([...selectedValues, opt.value])}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md border border-dashed",
                    "hover:border-primary hover:bg-muted transition-colors"
                  )}
                >
                  + {opt.label}
                </button>
              ))}
          </div>
        </div>
      );

    case "date":
      const dateValue = value ? new Date(String(value)) : undefined;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground",
                error && "border-destructive"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateValue ? format(dateValue, "PPP", { locale: ptBR }) : "Selecionar data..."}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 pointer-events-auto">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(date) => onChange(date?.toISOString())}
              className="pointer-events-auto"
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      );

    case "boolean":
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <span className="text-sm text-muted-foreground">
            {Boolean(value) ? "Sim" : "Não"}
          </span>
        </div>
      );

    case "relation":
      const relationOptions = getRelationOptions();
      return (
        <Select
          value={String(value || "")}
          onValueChange={(val) => onChange(val)}
        >
          <SelectTrigger className={cn(error && "border-destructive")}>
            <SelectValue placeholder={`Selecione ${column.name.toLowerCase()}...`} />
          </SelectTrigger>
          <SelectContent>
            {relationOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    default:
      return (
        <Input
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};

export const PropertyDrawer = ({
  open,
  onOpenChange,
  tableId,
  row,
  columns,
  onSave,
}: PropertyDrawerProps) => {
  const { toast } = useToast();
  const { canChangeSelectField } = useProcessStore();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processErrors, setProcessErrors] = useState<string[]>([]);
  const [blockedFields, setBlockedFields] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  
  // Keep track of original row data for validation
  const originalRowRef = useRef<TableRow | null>(null);

  useEffect(() => {
    if (row) {
      setFormData({ ...row });
      originalRowRef.current = row;
      setErrors({});
      setProcessErrors([]);
      setBlockedFields(new Set());
      setIsDirty(false);
    }
  }, [row]);

  const handleFieldChange = (columnId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [columnId]: value }));
    setIsDirty(true);

    // Clear error on change
    if (errors[columnId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[columnId];
        return next;
      });
    }

    // Clear from blocked fields if it was filled
    if (blockedFields.has(columnId)) {
      setBlockedFields((prev) => {
        const next = new Set(prev);
        next.delete(columnId);
        return next;
      });
      // Re-validate to potentially clear process errors
      setProcessErrors([]);
    }
  };

  // Handle select field changes with process validation
  const handleSelectChange = (column: ColumnDefinition, newValue: string): boolean => {
    if (tableId !== "deals" || !originalRowRef.current) {
      return true; // Allow change if not deals table
    }

    const originalValue = originalRowRef.current[column.id];
    
    // If value hasn't changed from original, allow
    if (originalValue === newValue) {
      return true;
    }

    // Validate the change using current form data (which may have required fields filled)
    const validation = canChangeSelectField({
      deal: formData as Record<string, unknown>,
      fieldKey: column.id,
      fromValue: String(originalValue || ""),
      toValue: newValue,
    });

    if (!validation.ok) {
      // Show error
      if (validation.transitionBlocked) {
        toast({
          variant: "destructive",
          title: "Transição não permitida",
          description: validation.message,
        });
      } else {
        // Mark missing fields
        const newErrors: Record<string, string> = { ...errors };
        const newBlockedFields = new Set(blockedFields);
        
        validation.missingFields.forEach((f) => {
          newErrors[f.fieldKey] = `Obrigatório para alterar ${column.name}`;
          newBlockedFields.add(f.fieldKey);
        });
        
        setErrors(newErrors);
        setBlockedFields(newBlockedFields);
        setProcessErrors([validation.message]);
        
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: `Preencha os campos destacados para alterar "${column.name}"`,
        });
      }
      return false;
    }

    return true;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newProcessErrors: string[] = [];

    // Standard required field validation
    columns.forEach((column) => {
      if (column.required) {
        const value = formData[column.id];
        if (value === undefined || value === null || value === "") {
          newErrors[column.id] = `${column.name} é obrigatório`;
        }
      }
    });

    // Process validation for deals table - check all select fields that changed
    if (tableId === "deals" && originalRowRef.current) {
      const selectColumns = columns.filter((c) => c.type === "select");
      
      for (const selectCol of selectColumns) {
        const originalValue = originalRowRef.current[selectCol.id];
        const newValue = formData[selectCol.id];
        
        // If select value changed, validate
        if (originalValue !== newValue && originalValue) {
          const validation = canChangeSelectField({
            deal: formData as Record<string, unknown>,
            fieldKey: selectCol.id,
            fromValue: String(originalValue),
            toValue: String(newValue || ""),
          });
          
          if (!validation.ok) {
            newProcessErrors.push(validation.message);
            
            // Mark missing fields
            validation.missingFields.forEach((f) => {
              newErrors[f.fieldKey] = `Obrigatório para alterar ${selectCol.name}`;
            });
          }
        }
      }
    }

    setErrors(newErrors);
    setProcessErrors(newProcessErrors);
    return Object.keys(newErrors).length === 0 && newProcessErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: processErrors.length > 0 
          ? "Preencha os campos obrigatórios do processo" 
          : "Preencha todos os campos obrigatórios",
      });
      return;
    }

    if (row) {
      onSave(row.id, formData);
      toast({
        title: "Alterações salvas",
        description: "O registro foi atualizado com sucesso",
      });
      onOpenChange(false);
    }
  };

  const handleSaveAndContinue = () => {
    if (!validate()) {
      toast({
        variant: "destructive",
        title: "Erro de validação",
        description: processErrors.length > 0 
          ? "Preencha os campos obrigatórios do processo" 
          : "Preencha todos os campos obrigatórios",
      });
      return;
    }

    if (row) {
      onSave(row.id, formData);
      // Update original ref after successful save
      originalRowRef.current = { ...row, ...formData } as TableRow;
      toast({
        title: "Alterações salvas",
        description: "Continue editando o registro",
      });
      setIsDirty(false);
      setProcessErrors([]);
      setBlockedFields(new Set());
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      const confirmed = window.confirm(
        "Você tem alterações não salvas. Deseja descartar?"
      );
      if (!confirmed) return;
    }
    onOpenChange(false);
  };

  // Sort columns by order
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);

  return (
    <Sheet open={open} onOpenChange={handleCancel}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span>Editar Registro</span>
            {isDirty && (
              <Badge variant="secondary" className="text-xs">
                Alterado
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Process validation errors */}
        {processErrors.length > 0 && (
          <div className="mt-4 p-3 rounded-lg border border-destructive/50 bg-destructive/10">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium text-sm">Bloqueio de Processo</span>
            </div>
            <ul className="text-sm text-destructive/90 list-disc list-inside">
              {processErrors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="py-6 space-y-1">
          {sortedColumns.map((column) => {
            const isBlocked = blockedFields.has(column.id);
            
            return (
              <div
                key={column.id}
                className={cn(
                  "grid grid-cols-[140px_1fr] gap-4 items-start py-3",
                  "border-b border-border last:border-0",
                  isBlocked && "bg-destructive/5 -mx-4 px-4 rounded-lg"
                )}
              >
                {/* Label Column */}
                <div className="flex flex-col pt-2">
                  <Label className={cn("font-medium text-sm", isBlocked && "text-destructive")}>
                    {column.name}
                    {(column.required || isBlocked) && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </Label>
                  {column.description && (
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {column.description}
                    </span>
                  )}
                  {isBlocked && (
                    <span className="text-xs text-destructive mt-1">
                      Obrigatório para sair da etapa
                    </span>
                  )}
                </div>

                {/* Value Column */}
                <div className="space-y-1">
                  {column.editable === false ? (
                    <div className="py-2 text-sm text-muted-foreground">
                      {column.type === "date" && formData[column.id]
                        ? format(new Date(String(formData[column.id])), "PPP", { locale: ptBR })
                        : column.type === "currency"
                        ? new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(formData[column.id]) || 0)
                        : String(formData[column.id] || "—")}
                    </div>
                  ) : (
                    <FieldEditor
                      column={column}
                      value={formData[column.id]}
                      onChange={(value) => handleFieldChange(column.id, value)}
                      onSelectChange={column.type === "select" ? handleSelectChange : undefined}
                      error={errors[column.id]}
                      tableId={tableId}
                    />
                  )}
                  {errors[column.id] && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors[column.id]}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <SheetFooter className="flex-row gap-2 sm:justify-between border-t pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSaveAndContinue} disabled={!isDirty}>
              Salvar e continuar
            </Button>
            <Button onClick={handleSave} disabled={!isDirty}>
              <Check className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

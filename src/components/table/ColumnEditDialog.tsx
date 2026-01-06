import { useState, useEffect } from "react";
import { ColumnDefinition, ColumnType, ColumnOption } from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { OptionsEditor } from "./OptionsEditor";

interface ColumnEditDialogProps {
  column: ColumnDefinition | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (column: ColumnDefinition) => void;
  existingValues?: unknown[]; // For type conversion suggestions
}

const columnTypes: { value: ColumnType; label: string; description: string }[] = [
  { value: "text", label: "Texto", description: "Campo de texto livre" },
  { value: "number", label: "Número", description: "Valores numéricos" },
  { value: "currency", label: "Moeda (R$)", description: "Valores monetários em reais" },
  { value: "select", label: "Select", description: "Escolha única entre opções" },
  { value: "multi-select", label: "Multi-select", description: "Múltiplas escolhas" },
  { value: "date", label: "Data", description: "Seletor de data" },
  { value: "boolean", label: "Sim/Não", description: "Checkbox verdadeiro/falso" },
  { value: "relation", label: "Relação", description: "Referência a outra tabela" },
];

const relationTables = [
  { value: "companies", label: "Empresas" },
  { value: "contacts", label: "Contatos" },
  { value: "users", label: "Usuários" },
];

export const ColumnEditDialog = ({
  column,
  open,
  onOpenChange,
  onSave,
  existingValues = [],
}: ColumnEditDialogProps) => {
  const isNew = !column?.id.startsWith("col-") && !column;
  
  const [name, setName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [type, setType] = useState<ColumnType>("text");
  const [required, setRequired] = useState(false);
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<ColumnOption[]>([]);
  const [relationTable, setRelationTable] = useState<string>("");
  const [showTypeChangeWarning, setShowTypeChangeWarning] = useState(false);
  const [pendingType, setPendingType] = useState<ColumnType | null>(null);

  useEffect(() => {
    if (column) {
      setName(column.name);
      setFieldKey(column.fieldKey || column.id);
      setType(column.type);
      setRequired(column.required || false);
      setDescription(column.description || "");
      setOptions(column.options || []);
      setRelationTable(column.relationTable || "");
    } else {
      setName("");
      setFieldKey("");
      setType("text");
      setRequired(false);
      setDescription("");
      setOptions([]);
      setRelationTable("");
    }
  }, [column, open]);

  const handleTypeChange = (newType: ColumnType) => {
    if (column && existingValues.length > 0 && newType !== type) {
      // Check if type change might cause data loss
      const needsWarning = 
        (type === "select" && newType === "text") ||
        (type === "text" && newType === "select") ||
        (type === "select" && newType === "multi-select") ||
        (type === "multi-select" && newType === "select");

      if (needsWarning) {
        setPendingType(newType);
        setShowTypeChangeWarning(true);
        return;
      }
    }

    applyTypeChange(newType);
  };

  const applyTypeChange = (newType: ColumnType) => {
    setType(newType);

    // Auto-generate options from existing text values when converting to select
    if (newType === "select" || newType === "multi-select") {
      if (options.length === 0 && existingValues.length > 0) {
        const uniqueValues = [...new Set(existingValues.map(v => String(v || "")))].filter(Boolean);
        const suggestedOptions: ColumnOption[] = uniqueValues.slice(0, 10).map((val, idx) => ({
          value: val.toLowerCase().replace(/\s+/g, "_"),
          label: val,
          color: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"][idx % 5],
        }));
        setOptions(suggestedOptions);
      }
    }
  };

  const handleSave = () => {
    const updatedColumn: ColumnDefinition = {
      id: column?.id || `col-${Date.now()}`,
      name: name.trim(),
      fieldKey: fieldKey.trim() || name.toLowerCase().replace(/\s+/g, "_"),
      type,
      visible: column?.visible ?? true,
      order: column?.order ?? 999,
      required,
      editable: column?.editable ?? true,
      description: description.trim() || undefined,
      options: type === "select" || type === "multi-select" ? options : undefined,
      relationTable: type === "relation" ? relationTable : undefined,
    };

    onSave(updatedColumn);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isNew ? "Nova Coluna" : "Editar Coluna"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nome da Coluna *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Status, Prioridade..."
              />
            </div>

            {/* Field Key */}
            <div className="space-y-2">
              <Label>Chave do Campo</Label>
              <Input
                value={fieldKey}
                onChange={(e) => setFieldKey(e.target.value)}
                placeholder="Ex: status, priority..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Identificador usado internamente para mapear os dados
              </p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => handleTypeChange(v as ColumnType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columnTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div className="flex flex-col">
                        <span>{t.label}</span>
                        <span className="text-xs text-muted-foreground">{t.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Options Editor for select/multi-select */}
            {(type === "select" || type === "multi-select") && (
              <div className="border rounded-lg p-3 bg-muted/30">
                <OptionsEditor options={options} onChange={setOptions} />
              </div>
            )}

            {/* Relation Table */}
            {type === "relation" && (
              <div className="space-y-2">
                <Label>Tabela Relacionada</Label>
                <Select value={relationTable} onValueChange={setRelationTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a tabela..." />
                  </SelectTrigger>
                  <SelectContent>
                    {relationTables.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrição / Ajuda</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Texto de ajuda para esta coluna..."
                rows={2}
              />
            </div>

            {/* Required toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Campo Obrigatório</Label>
                <p className="text-xs text-muted-foreground">
                  Exigir preenchimento deste campo
                </p>
              </div>
              <Switch checked={required} onCheckedChange={setRequired} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!name.trim()}>
              {isNew ? "Adicionar" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Type Change Warning */}
      <AlertDialog open={showTypeChangeWarning} onOpenChange={setShowTypeChangeWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar tipo de coluna?</AlertDialogTitle>
            <AlertDialogDescription>
              Alterar o tipo desta coluna pode causar transformação ou perda de dados existentes.
              {pendingType === "select" && type === "text" && (
                <span className="block mt-2">
                  Os valores existentes serão sugeridos como opções.
                </span>
              )}
              {pendingType === "multi-select" && type === "select" && (
                <span className="block mt-2">
                  Valores únicos serão convertidos em arrays.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingType(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingType) {
                  applyTypeChange(pendingType);
                }
                setShowTypeChangeWarning(false);
                setPendingType(null);
              }}
            >
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

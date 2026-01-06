import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProcessesStore } from "@/stores/processesStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { getDealsSelectField, getDealsEditableFields, mergeProcessOptions } from "@/lib/processHelpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Copy,
  Trash2,
  Download,
  GripVertical,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Settings,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Process } from "@/types/process";

// Sortable Stage Item
const SortableStageItem = ({
  option,
  status,
  isSelected,
  requirementsCount,
  onClick,
}: {
  option: { value: string; label: string; color?: string };
  status: "current" | "new" | "obsolete";
  isSelected: boolean;
  requirementsCount: number;
  onClick: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: option.value,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        isDragging && "opacity-50",
        status === "obsolete" && "opacity-50 bg-muted"
      )}
      onClick={onClick}
    >
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: option.color || "#64748b" }}
      />
      
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate">{option.label}</span>
      </div>
      
      <div className="flex items-center gap-2">
        {status === "new" && (
          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
            Nova
          </Badge>
        )}
        {status === "obsolete" && (
          <Badge variant="outline" className="text-xs border-destructive text-destructive">
            Obsoleta
          </Badge>
        )}
        {requirementsCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {requirementsCount} req.
          </Badge>
        )}
      </div>
    </div>
  );
};

const ProcessoEditor = () => {
  const { processId } = useParams<{ processId: string }>();
  const navigate = useNavigate();
  const { activeOrganizationId } = useOrganizationStore();
  const { 
    processes,
    loading,
    loadProcesses,
    getProcess, 
    updateProcess, 
    deleteProcess, 
    duplicateProcess, 
    isProcessActive, 
    setActiveProcess 
  } = useProcessesStore();

  // Load processes when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadProcesses(activeOrganizationId);
    }
  }, [activeOrganizationId, loadProcesses]);

  const process = getProcess(processId || "");

  const [localProcess, setLocalProcess] = useState<Process | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [transitionFrom, setTransitionFrom] = useState("");
  const [transitionTo, setTransitionTo] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Initialize local state
  useEffect(() => {
    if (process) {
      setLocalProcess({ ...process });
    }
  }, [process]);

  // Get field info
  const selectField = useMemo(() => {
    if (!localProcess) return null;
    return getDealsSelectField(localProcess.selectFieldKey);
  }, [localProcess?.selectFieldKey]);

  // Merge options with schema
  const mergedOptions = useMemo(() => {
    if (!localProcess || !selectField) return [];
    return mergeProcessOptions(localProcess.selectFieldKey, localProcess.optionOrder);
  }, [localProcess, selectField]);

  // All editable fields for requirements
  const editableFields = useMemo(() => getDealsEditableFields(), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!process || !localProcess) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">Processo não encontrado</h3>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/processos")}>
            Voltar para Processos
          </Button>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!localProcess) return;
    setSaving(true);
    try {
      await updateProcess(localProcess.id, localProcess);
      setHasChanges(false);
      toast.success("Processo salvo");
    } catch (error) {
      toast.error("Erro ao salvar processo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteProcess(process.id);
      toast.success("Processo excluído");
      navigate("/processos");
    } catch (error) {
      toast.error("Erro ao excluir processo");
    }
  };

  const handleDuplicate = async () => {
    if (!activeOrganizationId) return;
    try {
      const duplicate = await duplicateProcess(activeOrganizationId, process.id);
      if (duplicate) {
        toast.success("Processo duplicado");
        navigate(`/processos/${duplicate.id}`);
      }
    } catch (error) {
      toast.error("Erro ao duplicar processo");
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(localProcess, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `processo-${localProcess?.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Processo exportado");
  };

  const updateLocal = (updates: Partial<Process>) => {
    setLocalProcess((prev) => (prev ? { ...prev, ...updates } : null));
    setHasChanges(true);
  };

  // Stage reorder
  const handleStageReorder = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !localProcess) return;

    const oldIndex = localProcess.optionOrder.indexOf(active.id as string);
    const newIndex = localProcess.optionOrder.indexOf(over.id as string);
    const newOrder = arrayMove(localProcess.optionOrder, oldIndex, newIndex);
    updateLocal({ optionOrder: newOrder });
  };

  // Transitions
  const handleAddTransition = () => {
    if (!transitionFrom || !transitionTo || !localProcess) return;
    
    if (transitionFrom === transitionTo) {
      toast.error("Origem e destino devem ser diferentes");
      return;
    }

    const exists = localProcess.transitions.some(
      (t) => t.from === transitionFrom && t.to === transitionTo
    );
    if (exists) {
      toast.error("Esta transição já existe");
      return;
    }

    updateLocal({
      transitions: [...localProcess.transitions, { from: transitionFrom, to: transitionTo }],
    });
    setTransitionFrom("");
    setTransitionTo("");
  };

  const handleRemoveTransition = (index: number) => {
    if (!localProcess) return;
    const newTransitions = localProcess.transitions.filter((_, i) => i !== index);
    updateLocal({ transitions: newTransitions });
  };

  // Requirements
  const handleToggleRequirement = (stageValue: string, fieldKey: string) => {
    if (!localProcess) return;
    
    const currentReqs = localProcess.stageRequirements[stageValue] || [];
    const newReqs = currentReqs.includes(fieldKey)
      ? currentReqs.filter((k) => k !== fieldKey)
      : [...currentReqs, fieldKey];

    updateLocal({
      stageRequirements: {
        ...localProcess.stageRequirements,
        [stageValue]: newReqs,
      },
    });
  };

  const getOptionLabel = (value: string) => {
    const opt = mergedOptions.find((o) => o.value === value);
    return opt?.label || value;
  };

  const isActive = isProcessActive(process.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/processos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <Input
              value={localProcess.name}
              onChange={(e) => updateLocal({ name: e.target.value })}
              className="text-xl font-bold border-none p-0 h-auto focus-visible:ring-0"
              placeholder="Nome do processo"
            />
            <p className="text-sm text-muted-foreground">
              Governa: {localProcess.selectFieldLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={localProcess.enabled}
              onCheckedChange={(enabled) => updateLocal({ enabled })}
            />
            <Label className="text-sm">
              {localProcess.enabled ? "Habilitado" : "Desabilitado"}
            </Label>
          </div>

          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Exportar
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-1" />
            Duplicar
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir processo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O processo será permanentemente excluído.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Active warning */}
      {localProcess.enabled && isActive && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/50 bg-primary/10 text-primary">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">
            Este processo está ativo e governa movimentações para o campo "{localProcess.selectFieldLabel}".
          </span>
        </div>
      )}

      {/* Main content */}
      <Tabs defaultValue="stages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="stages">Etapas</TabsTrigger>
          <TabsTrigger value="transitions">Transições</TabsTrigger>
          <TabsTrigger value="requirements">Requisitos</TabsTrigger>
        </TabsList>

        {/* Stages Tab */}
        <TabsContent value="stages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ordem das Etapas</CardTitle>
              <CardDescription>
                Arraste para reordenar as etapas. Novas opções do schema aparecem destacadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleStageReorder}
              >
                <SortableContext
                  items={localProcess.optionOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {mergedOptions.map((option) => (
                      <SortableStageItem
                        key={option.value}
                        option={option}
                        status={option.status}
                        isSelected={selectedStage === option.value}
                        requirementsCount={
                          (localProcess.stageRequirements[option.value] || []).length
                        }
                        onClick={() => setSelectedStage(option.value)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transitions Tab */}
        <TabsContent value="transitions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transições Permitidas</CardTitle>
              <CardDescription>
                Defina quais movimentações entre etapas são permitidas. Se nenhuma transição for definida, todas são permitidas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add transition form */}
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>De</Label>
                  <Select value={transitionFrom} onValueChange={setTransitionFrom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mergedOptions
                        .filter((o) => o.status !== "obsolete")
                        .map((opt) => (
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
                </div>

                <ArrowRight className="h-4 w-4 text-muted-foreground mb-2.5" />

                <div className="flex-1 space-y-2">
                  <Label>Para</Label>
                  <Select value={transitionTo} onValueChange={setTransitionTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mergedOptions
                        .filter((o) => o.status !== "obsolete")
                        .map((opt) => (
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
                </div>

                <Button onClick={handleAddTransition} disabled={!transitionFrom || !transitionTo}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {/* Transitions list */}
              {localProcess.transitions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma transição definida</p>
                  <p className="text-xs">Todas as movimentações são permitidas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {localProcess.transitions.map((t, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                    >
                      <Badge variant="outline">{getOptionLabel(t.from)}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{getOptionLabel(t.to)}</Badge>
                      <div className="flex-1" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveTransition(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab */}
        <TabsContent value="requirements" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Stage selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selecione uma Etapa</CardTitle>
                <CardDescription>
                  Clique para configurar os campos obrigatórios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {mergedOptions
                      .filter((o) => o.status !== "obsolete")
                      .map((option) => {
                        const reqs = localProcess.stageRequirements[option.value] || [];
                        return (
                          <div
                            key={option.value}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                              selectedStage === option.value
                                ? "border-primary bg-primary/5"
                                : "hover:border-primary/50"
                            )}
                            onClick={() => setSelectedStage(option.value)}
                          >
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: option.color || "#64748b" }}
                            />
                            <span className="flex-1 font-medium">{option.label}</span>
                            {reqs.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {reqs.length}
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Requirements config */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  Campos Obrigatórios para Sair
                  {selectedStage && (
                    <span className="text-primary ml-2">
                      de "{getOptionLabel(selectedStage)}"
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Marque os campos que devem estar preenchidos para o negócio sair desta etapa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedStage ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Selecione uma etapa para configurar</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {editableFields.map((field) => {
                        const isRequired = (
                          localProcess.stageRequirements[selectedStage] || []
                        ).includes(field.id);

                        return (
                          <div
                            key={field.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all",
                              isRequired && "border-primary/50 bg-primary/5"
                            )}
                          >
                            <Checkbox
                              checked={isRequired}
                              onCheckedChange={() =>
                                handleToggleRequirement(selectedStage, field.id)
                              }
                            />
                            <div className="flex-1">
                              <p className="font-medium">{field.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Tipo: {field.type}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProcessoEditor;

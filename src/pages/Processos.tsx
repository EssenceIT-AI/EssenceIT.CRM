import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProcessesStore } from "@/stores/processesStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { getDealsSelectFields } from "@/lib/processHelpers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, AlertCircle, Settings2, Trash2, Copy, Star, StarOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Processos = () => {
  const navigate = useNavigate();
  const { activeOrganizationId } = useOrganizationStore();
  const {
    processes,
    loading,
    loadProcesses,
    getProcesses,
    createProcess,
    deleteProcess,
    duplicateProcess,
    updateProcess,
    setActiveProcess,
    isProcessActive,
    enforcementEnabled,
    toggleEnforcement,
  } = useProcessesStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProcessName, setNewProcessName] = useState("");
  const [newProcessField, setNewProcessField] = useState("");

  const selectFields = useMemo(() => getDealsSelectFields(), []);

  // Load processes when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadProcesses(activeOrganizationId);
    }
  }, [activeOrganizationId, loadProcesses]);

  const handleCreateProcess = async () => {
    if (!newProcessName.trim()) {
      toast.error("Nome do processo é obrigatório");
      return;
    }

    if (!newProcessField) {
      toast.error("Selecione um campo");
      return;
    }

    if (!activeOrganizationId) {
      toast.error("Nenhuma organização ativa");
      return;
    }

    const field = selectFields.find((f) => f.key === newProcessField);
    if (!field) return;

    setCreating(true);
    try {
      const process = await createProcess(activeOrganizationId, {
        name: newProcessName.trim(),
        enabled: true,
        selectFieldKey: newProcessField,
        selectFieldLabel: field.label,
        optionOrder: field.options.map((opt) => opt.value),
        transitions: [],
        stageRequirements: {},
      });

      toast.success("Processo criado com sucesso");
      setCreateDialogOpen(false);
      setNewProcessName("");
      setNewProcessField("");

      // Navigate to editor
      navigate(`/processos/${process.id}`);
    } catch (error) {
      toast.error("Erro ao criar processo");
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este processo?")) {
      try {
        await deleteProcess(id);
        toast.success("Processo excluído");
      } catch (error) {
        toast.error("Erro ao excluir processo");
      }
    }
  };

  const handleDuplicate = async (id: string) => {
    if (!activeOrganizationId) return;
    try {
      const duplicate = await duplicateProcess(activeOrganizationId, id);
      if (duplicate) {
        toast.success("Processo duplicado");
      }
    } catch (error) {
      toast.error("Erro ao duplicar processo");
    }
  };

  const handleToggleActive = async (processId: string, selectFieldKey: string) => {
    if (!activeOrganizationId) return;
    const isActive = isProcessActive(processId);
    try {
      if (isActive) {
        await setActiveProcess(activeOrganizationId, selectFieldKey, null);
        toast.info("Processo desativado como principal");
      } else {
        await setActiveProcess(activeOrganizationId, selectFieldKey, processId);
        toast.success("Processo definido como ativo");
      }
    } catch (error) {
      toast.error("Erro ao alterar status do processo");
    }
  };

  const handleToggleEnabled = async (processId: string, enabled: boolean) => {
    try {
      await updateProcess(processId, { enabled });
      toast.success(enabled ? "Processo habilitado" : "Processo desabilitado");
    } catch (error) {
      toast.error("Erro ao alterar processo");
    }
  };

  // Group processes by select field
  const processesByField = useMemo(() => {
    const grouped: Record<string, typeof processes> = {};
    processes.forEach((p) => {
      if (!grouped[p.selectFieldKey]) {
        grouped[p.selectFieldKey] = [];
      }
      grouped[p.selectFieldKey].push(p);
    });
    return grouped;
  }, [processes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Processos</h1>
          <p className="text-muted-foreground">
            Configure regras de fluxo e requisitos por etapa para seus negócios
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="enforcement" className="text-sm text-muted-foreground">
              Enforcement Global
            </Label>
            <Switch
              id="enforcement"
              checked={enforcementEnabled}
              onCheckedChange={toggleEnforcement}
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Processo
          </Button>
        </div>
      </div>

      {/* Enforcement warning */}
      {!enforcementEnabled && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/50 bg-amber-500/10 text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">
            O enforcement global está desativado. As regras de processo não serão aplicadas.
          </span>
        </div>
      )}

      {/* Process Cards */}
      {processes.length === 0 ? (
        <Card className="p-12 text-center">
          <Settings2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum processo configurado</h3>
          <p className="text-muted-foreground mb-4">
            Crie um processo para definir regras de fluxo e campos obrigatórios por etapa.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Processo
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(processesByField).map(([fieldKey, fieldProcesses]) => (
            <div key={fieldKey}>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Campo: {fieldProcesses[0]?.selectFieldLabel || fieldKey}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {fieldProcesses.map((process) => {
                  const isActive = isProcessActive(process.id);
                  const requirementsCount = Object.values(process.stageRequirements).flat().length;
                  const transitionsCount = process.transitions.length;

                  return (
                    <Card
                      key={process.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors relative group"
                      onClick={() => navigate(`/processos/${process.id}`)}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-lg" />
                      )}
                      
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                              {process.name}
                              {isActive && (
                                <Badge variant="default" className="text-xs">
                                  Ativo
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {process.selectFieldLabel}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(process.id, process.selectFieldKey);
                                }}
                              >
                                {isActive ? (
                                  <>
                                    <StarOff className="h-4 w-4 mr-2" />
                                    Remover como ativo
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Tornar ativo
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(process.id);
                                }}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(process.id);
                                }}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <span>{process.optionOrder.length} etapas</span>
                            <span>•</span>
                            <span>{transitionsCount} transições</span>
                            <span>•</span>
                            <span>{requirementsCount} requisitos</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            Atualizado {format(new Date(process.updatedAt), "dd MMM", { locale: ptBR })}
                          </span>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Switch
                              checked={process.enabled}
                              onCheckedChange={(checked) => handleToggleEnabled(process.id, checked)}
                              className="scale-75"
                            />
                            <span className="text-xs text-muted-foreground">
                              {process.enabled ? "Habilitado" : "Desabilitado"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Processo</DialogTitle>
            <DialogDescription>
              Configure um novo processo para governar o fluxo de trabalho dos negócios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Processo</Label>
              <Input
                value={newProcessName}
                onChange={(e) => setNewProcessName(e.target.value)}
                placeholder="Ex: Processo de Vendas"
              />
            </div>

            <div className="space-y-2">
              <Label>Campo Select Governado</Label>
              <Select value={newProcessField} onValueChange={setNewProcessField}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um campo..." />
                </SelectTrigger>
                <SelectContent>
                  {selectFields.map((field) => (
                    <SelectItem key={field.key} value={field.key}>
                      {field.label} ({field.options.length} opções)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                O processo controlará as transições e requisitos baseados neste campo
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProcess} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Processo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Processos;

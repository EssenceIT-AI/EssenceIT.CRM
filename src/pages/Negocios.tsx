import { useEffect, useState } from "react";
import { DynamicTable } from "@/components/table";
import { ExportImportPanel } from "@/components/table/ExportImportPanel";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNegociosStore } from "@/stores/negociosStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useAuth } from "@/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

const Negocios = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeOrganizationId } = useOrganizationStore();
  const { 
    negocios, 
    schema, 
    loading, 
    schemaLoading,
    loadNegocios, 
    loadSchema, 
    createNegocio 
  } = useNegociosStore();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: "",
    value: 0,
    stage: "prospecting",
    product: "VAR",
    origin: "inbound",
  });

  // Load data when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadNegocios(activeOrganizationId);
      loadSchema(activeOrganizationId);
    }
  }, [activeOrganizationId, loadNegocios, loadSchema]);

  const productOptions = schema?.columns.find(c => c.id === "product")?.options || [];
  const originOptions = schema?.columns.find(c => c.id === "origin")?.options || [];
  const stageOptions = schema?.columns.find(c => c.id === "stage")?.options || [];

  const handleCreateDeal = async () => {
    if (!newDeal.title.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome do negócio",
      });
      return;
    }

    setCreating(true);
    
    try {
      await createNegocio({
        title: newDeal.title.trim(),
        value: newDeal.value,
        owner_id: user?.id || null,
        props: {
          stage: newDeal.stage,
          product: newDeal.product,
          origin: newDeal.origin,
        },
      });

      toast({
        title: "Negócio criado",
        description: `"${newDeal.title}" foi adicionado com sucesso`,
      });

      setNewDeal({
        title: "",
        value: 0,
        stage: "prospecting",
        product: "VAR",
        origin: "inbound",
      });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar negócio",
        description: "Tente novamente",
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading || schemaLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Negócios</h1>
          <p className="text-muted-foreground">
            Gerencie suas oportunidades de vendas • {negocios.length} negócios
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportPanel tableId="deals" />
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Negócio
          </Button>
        </div>
      </div>
      
      <DynamicTable 
        tableId="deals" 
        className="h-[calc(100vh-220px)]"
        showPropertyDrawer={true}
      />

      {/* Create Deal Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Negócio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Negócio *</Label>
              <Input
                value={newDeal.title}
                onChange={(e) => setNewDeal({ ...newDeal, title: e.target.value })}
                placeholder="Ex: Projeto X - Empresa Y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={newDeal.product}
                  onValueChange={(value) => setNewDeal({ ...newDeal, product: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Origem</Label>
                <Select
                  value={newDeal.origin}
                  onValueChange={(value) => setNewDeal({ ...newDeal, origin: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {originOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Etapa</Label>
              <Select
                value={newDeal.stage}
                onValueChange={(value) => setNewDeal({ ...newDeal, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input
                type="number"
                value={newDeal.value}
                onChange={(e) => setNewDeal({ ...newDeal, value: Number(e.target.value) })}
                placeholder="0,00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDeal} disabled={creating}>
              {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Negócio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Negocios;

import { useState } from "react";
import { DynamicTable } from "@/components/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import { useDataStore } from "@/stores";
import { useToast } from "@/hooks/use-toast";

const Configuracoes = () => {
  const { toast } = useToast();
  const { createConfig } = useDataStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newConfig, setNewConfig] = useState({
    key: "",
    value: "",
    category: "geral",
    description: "",
  });

  const handleCreateConfig = () => {
    if (!newConfig.key.trim()) {
      toast({
        variant: "destructive",
        title: "Chave obrigatória",
        description: "Preencha a chave da configuração",
      });
      return;
    }

    if (!newConfig.value.trim()) {
      toast({
        variant: "destructive",
        title: "Valor obrigatório",
        description: "Preencha o valor da configuração",
      });
      return;
    }

    createConfig({
      key: newConfig.key.trim(),
      value: newConfig.value.trim(),
      category: newConfig.category,
      description: newConfig.description.trim(),
    });

    toast({
      title: "Configuração criada",
      description: `"${newConfig.key}" foi adicionada com sucesso`,
    });

    setNewConfig({
      key: "",
      value: "",
      category: "geral",
      description: "",
    });
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">
            Parâmetros e configurações do sistema
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Configuração
        </Button>
      </div>

      <DynamicTable
        tableId="configs"
        className="h-[calc(100vh-220px)]"
        showPropertyDrawer={true}
      />

      {/* Create Config Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Configuração</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Chave *</Label>
              <Input
                value={newConfig.key}
                onChange={(e) =>
                  setNewConfig({ ...newConfig, key: e.target.value })
                }
                placeholder="Ex: meta_mensal_vendas"
              />
            </div>

            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                value={newConfig.value}
                onChange={(e) =>
                  setNewConfig({ ...newConfig, value: e.target.value })
                }
                placeholder="Ex: 500000"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={newConfig.category}
                onValueChange={(value) =>
                  setNewConfig({ ...newConfig, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Geral</SelectItem>
                  <SelectItem value="metas">Metas</SelectItem>
                  <SelectItem value="etapas">Etapas</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newConfig.description}
                onChange={(e) =>
                  setNewConfig({ ...newConfig, description: e.target.value })
                }
                placeholder="Descrição opcional"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateConfig}>Criar Configuração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracoes;

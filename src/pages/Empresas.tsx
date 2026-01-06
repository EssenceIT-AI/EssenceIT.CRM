import { useState, useEffect } from "react";
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
import { useCompaniesStore, useSchemaStore } from "@/stores";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useToast } from "@/hooks/use-toast";

const Empresas = () => {
  const { toast } = useToast();
  const { activeOrganizationId } = useOrganizationStore();
  const { companies, loading, loadCompanies, createCompany } = useCompaniesStore();
  const { getSchema } = useSchemaStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: "",
    domain: "",
    industry: "technology",
    size: "small",
    country: "Brasil",
    city: "",
  });

  // Load companies when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadCompanies(activeOrganizationId);
    }
  }, [activeOrganizationId, loadCompanies]);

  const schema = getSchema("companies");
  const industryOptions = schema?.columns.find(c => c.id === "industry")?.options || [];
  const sizeOptions = schema?.columns.find(c => c.id === "size")?.options || [];

  const handleCreateCompany = async () => {
    if (!newCompany.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome da empresa",
      });
      return;
    }

    if (!activeOrganizationId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhuma organização ativa",
      });
      return;
    }

    setCreating(true);
    try {
      await createCompany(activeOrganizationId, {
        name: newCompany.name.trim(),
        domain: newCompany.domain.trim() || null,
        industry: newCompany.industry || null,
        size: newCompany.size || null,
        country: newCompany.country || null,
        city: newCompany.city.trim() || null,
      });

      toast({
        title: "Empresa criada",
        description: `"${newCompany.name}" foi adicionada com sucesso`,
      });

      setNewCompany({
        name: "",
        domain: "",
        industry: "technology",
        size: "small",
        country: "Brasil",
        city: "",
      });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar empresa",
        description: (error as Error).message,
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground">
            Base de clientes e prospects • {companies.length} empresas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportPanel tableId="companies" />
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
        </div>
      </div>

      <DynamicTable
        tableId="companies"
        className="h-[calc(100vh-220px)]"
        showPropertyDrawer={true}
      />

      {/* Create Company Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Empresa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Ex: Tech Solutions Ltda"
              />
            </div>

            <div className="space-y-2">
              <Label>Domínio</Label>
              <Input
                value={newCompany.domain}
                onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                placeholder="Ex: empresa.com.br"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Segmento</Label>
                <Select
                  value={newCompany.industry}
                  onValueChange={(value) => setNewCompany({ ...newCompany, industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Porte</Label>
                <Select
                  value={newCompany.size}
                  onValueChange={(value) => setNewCompany({ ...newCompany, size: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>País</Label>
                <Input
                  value={newCompany.country}
                  onChange={(e) => setNewCompany({ ...newCompany, country: e.target.value })}
                  placeholder="Brasil"
                />
              </div>

              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input
                  value={newCompany.city}
                  onChange={(e) => setNewCompany({ ...newCompany, city: e.target.value })}
                  placeholder="São Paulo"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCompany} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Empresa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Empresas;

import { useState } from "react";
import { DynamicTable } from "@/components/table";
import { ExportImportPanel } from "@/components/table/ExportImportPanel";
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
import { Checkbox } from "@/components/ui/checkbox";

const Usuarios = () => {
  const { toast } = useToast();
  const { createUser, getRoles, getCompanies } = useDataStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    roleId: "",
    companyScope: [] as string[],
    status: "active" as "active" | "inactive",
  });

  const roles = getRoles();
  const companies = getCompanies();

  const handleCompanyToggle = (companyId: string) => {
    setNewUser((prev) => ({
      ...prev,
      companyScope: prev.companyScope.includes(companyId)
        ? prev.companyScope.filter((id) => id !== companyId)
        : [...prev.companyScope, companyId],
    }));
  };

  const handleCreateUser = () => {
    if (!newUser.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome do usuário",
      });
      return;
    }

    if (!newUser.email.trim()) {
      toast({
        variant: "destructive",
        title: "Email obrigatório",
        description: "Preencha o email do usuário",
      });
      return;
    }

    if (!newUser.roleId) {
      toast({
        variant: "destructive",
        title: "Perfil obrigatório",
        description: "Selecione um perfil de acesso",
      });
      return;
    }

    createUser({
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      roleId: newUser.roleId,
      companyScope: newUser.companyScope,
      status: newUser.status,
    });

    toast({
      title: "Usuário criado",
      description: `"${newUser.name}" foi adicionado com sucesso`,
    });

    setNewUser({
      name: "",
      email: "",
      roleId: "",
      companyScope: [],
      status: "active",
    });
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground">Gerencie os usuários do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportPanel tableId="users" />
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      <DynamicTable
        tableId="users"
        className="h-[calc(100vh-220px)]"
        showPropertyDrawer={true}
      />

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Perfil de Acesso *</Label>
                <Select
                  value={newUser.roleId}
                  onValueChange={(value) => setNewUser({ ...newUser, roleId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newUser.status}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, status: value as "active" | "inactive" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Empresas Vinculadas</Label>
              <p className="text-xs text-muted-foreground">
                O usuário terá acesso apenas aos dados dessas empresas
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                {companies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={company.id}
                      checked={newUser.companyScope.includes(company.id)}
                      onCheckedChange={() => handleCompanyToggle(company.id)}
                    />
                    <label
                      htmlFor={company.id}
                      className="text-sm cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {company.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>Criar Usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Usuarios;

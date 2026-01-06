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
import { Textarea } from "@/components/ui/textarea";
import { useDataStore } from "@/stores";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { permissions, Permission } from "@/config/app.config";

const permissionCategories = {
  "Negócios": ["deals:view", "deals:create", "deals:edit", "deals:delete"],
  "Kanban": ["kanban:view", "kanban:edit"],
  "Empresas": ["companies:view", "companies:create", "companies:edit", "companies:delete"],
  "Contatos": ["contacts:view", "contacts:create", "contacts:edit", "contacts:delete"],
  "Dashboards": ["dashboard:view", "dashboard:clevel", "dashboard:marketing"],
  "Administração": ["admin:users", "admin:roles", "admin:settings"],
};

const Perfis = () => {
  const { toast } = useToast();
  const { createRole } = useDataStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    name: "",
    description: "",
    permissions: [] as Permission[],
  });

  const handlePermissionToggle = (permission: Permission) => {
    setNewRole((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleCategoryToggle = (category: string) => {
    const categoryPerms = permissionCategories[category as keyof typeof permissionCategories] as Permission[];
    const allSelected = categoryPerms.every((p) => newRole.permissions.includes(p));

    if (allSelected) {
      setNewRole((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => !categoryPerms.includes(p)),
      }));
    } else {
      setNewRole((prev) => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...categoryPerms])],
      }));
    }
  };

  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome do perfil",
      });
      return;
    }

    createRole({
      name: newRole.name.trim(),
      description: newRole.description.trim(),
      permissions: newRole.permissions,
    });

    toast({
      title: "Perfil criado",
      description: `"${newRole.name}" foi adicionado com sucesso`,
    });

    setNewRole({
      name: "",
      description: "",
      permissions: [],
    });
    setCreateDialogOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Perfis de Acesso</h1>
          <p className="text-muted-foreground">
            Configure permissões por perfil (RBAC)
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Perfil
        </Button>
      </div>

      <DynamicTable
        tableId="roles"
        className="h-[calc(100vh-220px)]"
        showPropertyDrawer={true}
      />

      {/* Create Role Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Perfil de Acesso</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Perfil *</Label>
              <Input
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="Ex: Gerente de Vendas"
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newRole.description}
                onChange={(e) =>
                  setNewRole({ ...newRole, description: e.target.value })
                }
                placeholder="Descreva as responsabilidades deste perfil..."
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <Label>Permissões</Label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(permissionCategories).map(([category, perms]) => {
                  const categoryPerms = perms as Permission[];
                  const allSelected = categoryPerms.every((p) =>
                    newRole.permissions.includes(p)
                  );
                  const someSelected =
                    categoryPerms.some((p) => newRole.permissions.includes(p)) &&
                    !allSelected;

                  return (
                    <div
                      key={category}
                      className="space-y-2 border rounded-lg p-3 bg-muted/30"
                    >
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={allSelected}
                          ref={(el) => {
                            if (el) {
                              (el as HTMLButtonElement & { indeterminate: boolean }).indeterminate =
                                someSelected;
                            }
                          }}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <label
                          htmlFor={`cat-${category}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {category}
                        </label>
                      </div>
                      <div className="ml-6 space-y-1">
                        {categoryPerms.map((perm) => (
                          <div key={perm} className="flex items-center space-x-2">
                            <Checkbox
                              id={perm}
                              checked={newRole.permissions.includes(perm)}
                              onCheckedChange={() => handlePermissionToggle(perm)}
                            />
                            <label
                              htmlFor={perm}
                              className="text-xs cursor-pointer text-muted-foreground"
                            >
                              {permissions[perm]}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRole}>Criar Perfil</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Perfis;

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
import { useContactsStore, useCompaniesStore } from "@/stores";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useToast } from "@/hooks/use-toast";

const Contatos = () => {
  const { toast } = useToast();
  const { activeOrganizationId } = useOrganizationStore();
  const { contacts, loading, loadContacts, createContact } = useContactsStore();
  const { companies, loadCompanies } = useCompaniesStore();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyId: "",
    position: "",
  });

  // Load data when org changes
  useEffect(() => {
    if (activeOrganizationId) {
      loadContacts(activeOrganizationId);
      loadCompanies(activeOrganizationId);
    }
  }, [activeOrganizationId, loadContacts, loadCompanies]);

  const handleCreateContact = async () => {
    if (!newContact.firstName.trim()) {
      toast({
        variant: "destructive",
        title: "Nome obrigatório",
        description: "Preencha o nome do contato",
      });
      return;
    }

    if (!newContact.email.trim()) {
      toast({
        variant: "destructive",
        title: "Email obrigatório",
        description: "Preencha o email do contato",
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
      await createContact(activeOrganizationId, {
        first_name: newContact.firstName.trim(),
        last_name: newContact.lastName.trim() || null,
        email: newContact.email.trim() || null,
        phone: newContact.phone.trim() || null,
        company_id: newContact.companyId || null,
        position: newContact.position.trim() || null,
      });

      toast({
        title: "Contato criado",
        description: `"${newContact.firstName} ${newContact.lastName}" foi adicionado com sucesso`,
      });

      setNewContact({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        companyId: "",
        position: "",
      });
      setCreateDialogOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao criar contato",
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
          <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
          <p className="text-muted-foreground">
            Pessoas de contato nas empresas • {contacts.length} contatos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportImportPanel tableId="contacts" />
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Novo Contato
          </Button>
        </div>
      </div>

      <DynamicTable
        tableId="contacts"
        className="h-[calc(100vh-220px)]"
        showPropertyDrawer={true}
      />

      {/* Create Contact Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Contato</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={newContact.firstName}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                  placeholder="Nome"
                />
              </div>

              <div className="space-y-2">
                <Label>Sobrenome</Label>
                <Input
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                  placeholder="Sobrenome"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                placeholder="email@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label>Empresa</Label>
              <Select
                value={newContact.companyId}
                onValueChange={(value) => setNewContact({ ...newContact, companyId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa..." />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input
                value={newContact.position}
                onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                placeholder="Ex: Diretor de TI"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateContact} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Contato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Contatos;

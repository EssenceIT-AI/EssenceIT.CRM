import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useOrganizationStore } from "@/stores/organizationStore";
import { invitesRepo } from "@/data/invitesRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2, Copy, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InviteMemberDialogProps {
  trigger?: React.ReactNode;
}

export function InviteMemberDialog({ trigger }: InviteMemberDialogProps) {
  const { user } = useAuth();
  const { activeOrganizationId } = useOrganizationStore();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [isLoading, setIsLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !activeOrganizationId) {
      toast({ title: "Erro", description: "Organização não selecionada", variant: "destructive" });
      return;
    }

    if (!email.trim()) {
      toast({ title: "Erro", description: "Email é obrigatório", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      const invite = await invitesRepo.create({
        organization_id: activeOrganizationId,
        email: email.trim().toLowerCase(),
        role,
        invited_by: user.id,
      });

      const link = `${window.location.origin}/onboarding?token=${invite.token}`;
      setInviteLink(link);
      
      toast({ 
        title: "Convite criado!", 
        description: "Copie o link e envie para o usuário." 
      });
    } catch (error: any) {
      if (error.code === "23505") {
        toast({ 
          title: "Erro", 
          description: "Já existe um convite pendente para este email", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Erro", 
          description: error.message || "Não foi possível criar o convite", 
          variant: "destructive" 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Link copiado!" });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setEmail("");
    setRole("member");
    setInviteLink(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => isOpen ? setOpen(true) : handleClose()}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Convidar Membro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Membro</DialogTitle>
          <DialogDescription>
            Envie um convite por email para adicionar um novo membro à organização.
          </DialogDescription>
        </DialogHeader>

        {inviteLink ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Link de Convite</Label>
              <div className="flex gap-2">
                <Input 
                  value={inviteLink} 
                  readOnly 
                  className="text-xs"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Este link expira em 7 dias. Envie para {email} para que aceite o convite.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@empresa.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Função</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "member" | "admin")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membro</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Convite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

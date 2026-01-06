import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { useOrganizationStore } from "@/stores/organizationStore";
import { invitesRepo, OrganizationInvite } from "@/data/invitesRepo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, Mail, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const Onboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { createOrganization, loadOrganizations } = useOrganizationStore();
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<OrganizationInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);

  // Check for invite token in URL
  const inviteToken = searchParams.get("token");

  useEffect(() => {
    const loadInvites = async () => {
      if (!user) return;
      
      setLoadingInvites(true);
      try {
        const invites = await invitesRepo.listPendingForUser();
        setPendingInvites(invites);
        
        // If there's a token in URL, try to accept it automatically
        if (inviteToken) {
          await handleAcceptInvite(inviteToken);
        }
      } catch (error) {
        console.error("Error loading invites:", error);
      } finally {
        setLoadingInvites(false);
      }
    };

    loadInvites();
  }, [user, inviteToken]);

  const handleAcceptInvite = async (token: string) => {
    if (!user) return;
    
    setAcceptingInvite(token);
    
    const result = await invitesRepo.accept(token);
    
    setAcceptingInvite(null);

    if (result.success) {
      toast({ title: "Convite aceito!", description: "Você agora faz parte da organização." });
      await loadOrganizations(user.id);
      navigate("/");
    } else {
      toast({ title: "Erro", description: result.error || "Não foi possível aceitar o convite", variant: "destructive" });
      // Remove from pending list if it failed
      setPendingInvites(prev => prev.filter(i => i.token !== token));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
      return;
    }

    if (!name.trim()) {
      toast({ title: "Erro", description: "Nome da empresa é obrigatório", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    const result = await createOrganization(name.trim(), user.id);
    
    setIsLoading(false);

    if (result.success) {
      toast({ title: "Empresa criada!", description: "Sua empresa foi criada com sucesso." });
      navigate("/");
    } else {
      toast({ title: "Erro", description: result.error, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Building2 className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Bem-vindo ao CRM Hub</h1>
          <p className="text-muted-foreground mt-2">
            {pendingInvites.length > 0 
              ? "Você tem convites pendentes ou pode criar uma nova empresa"
              : "Para começar, crie sua primeira empresa"
            }
          </p>
        </div>

        {/* Pending Invites */}
        {loadingInvites ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingInvites.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Convites Pendentes</Label>
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    {invite.organization?.name || "Organização"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Função: {invite.role === "owner" ? "Proprietário" : invite.role === "admin" ? "Administrador" : "Membro"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleAcceptInvite(invite.token)}
                    disabled={acceptingInvite === invite.token}
                  >
                    {acceptingInvite === invite.token ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Aceitar Convite
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Divider if has invites */}
        {pendingInvites.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou crie uma nova empresa</span>
            </div>
          </div>
        )}

        {/* Create Organization Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl border border-border bg-card">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Minha Empresa"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Empresa
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;

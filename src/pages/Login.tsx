import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

export const Login = () => {
  const navigate = useNavigate();
  const { signInWithPassword, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({ 
        title: "Erro de validação", 
        description: validation.error.errors[0].message, 
        variant: "destructive" 
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({ title: "Erro", description: "Este email já está cadastrado.", variant: "destructive" });
          } else {
            toast({ title: "Erro", description: error.message, variant: "destructive" });
          }
        } else {
          toast({ title: "Conta criada!", description: "Você já pode fazer login." });
          setIsSignUp(false);
        }
      } else {
        const { error } = await signInWithPassword(email, password);
        if (error) {
          toast({ title: "Erro", description: "Credenciais inválidas.", variant: "destructive" });
        } else {
          toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
          navigate("/");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-glow">
              <Target className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">CRM Hub</h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? "Crie sua conta" : "Entre com suas credenciais"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-xl border border-border bg-card">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? "Criar conta" : "Entrar"}
          </Button>
          
          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground"
            >
              {isSignUp ? "Já tem uma conta? Entrar" : "Não tem conta? Criar conta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;

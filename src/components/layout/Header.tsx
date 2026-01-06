import { useAuth } from "@/auth/AuthProvider";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useUiStore, useDataStore } from "@/stores";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { OrganizationSwitcher } from "./OrganizationSwitcher";
import { InviteMemberDialog } from "@/components/organization/InviteMemberDialog";
import { 
  Search, 
  Bell, 
  User, 
  LogOut, 
  Settings, 
  RefreshCw,
  Moon,
  Sun,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

export const Header = () => {
  const navigate = useNavigate();
  const { sidebarOpen, toggleGlobalSearch, theme, toggleTheme } = useUiStore();
  const { user, signOut } = useAuth();
  const { reset: resetOrganizations } = useOrganizationStore();
  const { reseedData } = useDataStore();
  
  const handleLogout = async () => {
    resetOrganizations();
    await signOut();
    navigate("/login");
    toast({
      title: "Sessão encerrada",
      description: "Você foi deslogado com sucesso.",
    });
  };
  
  const handleReseed = () => {
    reseedData();
    toast({
      title: "Dados reiniciados",
      description: "Os dados foram restaurados para o estado inicial.",
    });
  };
  
  const getInitials = (email: string) => {
    return email
      .split("@")[0]
      .slice(0, 2)
      .toUpperCase();
  };
  
  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300",
        sidebarOpen ? "left-64" : "left-16"
      )}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side: Org Switcher + Search */}
        <div className="flex items-center gap-4">
          <OrganizationSwitcher />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar... (pressione /)"
              className="w-64 pl-9 bg-secondary/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              onFocus={toggleGlobalSearch}
              readOnly
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground opacity-100 sm:flex">
              /
            </kbd>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Invite member */}
          <InviteMemberDialog 
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            }
          />
          
          {/* Reseed button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReseed}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
          
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>
          
          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                    {user ? getInitials(user.email || "") : "??"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left md:flex">
                  <span className="text-sm font-medium text-foreground truncate max-w-[150px]">
                    {user?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium truncate">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/perfil")}>
                <User className="mr-2 h-4 w-4" />
                Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/admin/configuracoes")}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

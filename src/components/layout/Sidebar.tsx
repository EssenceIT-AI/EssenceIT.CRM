import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore, useUiStore } from "@/stores";
import {
  LayoutDashboard,
  Target,
  Kanban,
  Building2,
  Users,
  BarChart3,
  TrendingUp,
  Settings,
  UserCog,
  Shield,
  ChevronLeft,
  ChevronRight,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  permission?: string;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", path: "/" },
  { icon: Target, label: "Negócios", path: "/negocios", permission: "deals:view" },
  { icon: Kanban, label: "Kanban", path: "/kanban", permission: "kanban:view" },
  { icon: Workflow, label: "Processos", path: "/processos", permission: "deals:view" },
  { icon: Building2, label: "Empresas", path: "/empresas", permission: "companies:view" },
  { icon: Users, label: "Contatos", path: "/contatos", permission: "contacts:view" },
];

const dashboardNavItems: NavItem[] = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboards", permission: "dashboard:view" },
];

const adminNavItems: NavItem[] = [
  { icon: UserCog, label: "Usuários", path: "/admin/usuarios", permission: "admin:users" },
  { icon: Shield, label: "Perfis de Acesso", path: "/admin/perfis", permission: "admin:roles" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes", permission: "admin:settings" },
];

const NavGroup = ({ 
  items, 
  title, 
  isOpen 
}: { 
  items: NavItem[]; 
  title?: string; 
  isOpen: boolean;
}) => {
  const location = useLocation();
  const { hasPermission } = useAuthStore();
  
  const visibleItems = items.filter(item => 
    !item.permission || hasPermission(item.permission as never)
  );
  
  if (visibleItems.length === 0) return null;
  
  return (
    <div className="mb-6">
      {title && isOpen && (
        <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      )}
      <nav className="space-y-1">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          const Icon = item.icon;
          
          const linkContent = (
            <Link
              to={item.path}
              className={cn(
                "sidebar-item group",
                isActive && "sidebar-item-active bg-primary/10 text-primary",
                !isOpen && "justify-center px-2"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {isOpen && (
                <span className={cn(
                  "truncate transition-colors",
                  isActive ? "font-medium text-primary" : "text-sidebar-foreground group-hover:text-foreground"
                )}>
                  {item.label}
                </span>
              )}
            </Link>
          );
          
          if (!isOpen) {
            return (
              <Tooltip key={item.path} delayDuration={0}>
                <TooltipTrigger asChild>
                  {linkContent}
                </TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          }
          
          return <div key={item.path}>{linkContent}</div>;
        })}
      </nav>
    </div>
  );
};

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUiStore();
  const { hasAnyPermission } = useAuthStore();
  
  const showAdmin = hasAnyPermission(["admin:users", "admin:roles", "admin:settings"]);
  const showDashboards = hasAnyPermission(["dashboard:view", "dashboard:clevel", "dashboard:marketing"]);
  
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          !sidebarOpen && "justify-center px-2"
        )}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">CRM Hub</span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavGroup items={mainNavItems} isOpen={sidebarOpen} />
          {showDashboards && (
            <NavGroup items={dashboardNavItems} title="Dashboards" isOpen={sidebarOpen} />
          )}
          {showAdmin && (
            <NavGroup items={adminNavItems} title="Administração" isOpen={sidebarOpen} />
          )}
        </div>
        
        {/* Toggle button */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              !sidebarOpen && "px-2"
            )}
          >
            {sidebarOpen ? (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Recolher
              </>
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
};

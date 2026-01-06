import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores";
import { Permission } from "@/config/app.config";
import { ShieldX } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // If true, requires ALL permissions; otherwise, ANY permission
}

export const ProtectedRoute = ({
  children,
  permission,
  permissions = [],
  requireAll = false,
}: ProtectedRouteProps) => {
  const { isAuthenticated, hasPermission, hasAnyPermission } = useAuthStore();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Build list of required permissions
  const requiredPermissions = permission
    ? [permission, ...permissions]
    : permissions;

  // If no permissions specified, allow access
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Check permissions
  const hasAccess = requireAll
    ? requiredPermissions.every((p) => hasPermission(p))
    : hasAnyPermission(requiredPermissions);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center space-y-4">
        <ShieldX className="h-16 w-16 text-destructive/50" />
        <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
        <p className="text-muted-foreground max-w-md">
          Você não tem permissão para acessar esta página. Entre em contato com
          o administrador se acredita que isso é um erro.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

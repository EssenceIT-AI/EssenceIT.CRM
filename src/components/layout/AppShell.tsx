import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "@/auth/AuthProvider";
import { useOrganizationStore } from "@/stores/organizationStore";
import { useUiStore } from "@/stores";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
}

export const AppShell = ({ children }: AppShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { organizations, loading: orgLoading, loadOrganizations } = useOrganizationStore();
  const { sidebarOpen, theme } = useUiStore();
  const [initialized, setInitialized] = useState(false);

  // Load organizations when user is authenticated
  useEffect(() => {
    if (user && !authLoading) {
      loadOrganizations(user.id).then(() => setInitialized(true));
    }
  }, [user, authLoading, loadOrganizations]);

  // Auth guard
  useEffect(() => {
    const publicPaths = ["/login", "/register", "/onboarding"];
    if (!authLoading && !user && !publicPaths.includes(location.pathname)) {
      navigate("/login");
    }
  }, [user, authLoading, location.pathname, navigate]);

  // Redirect authenticated users away from login
  useEffect(() => {
    if (!authLoading && user && location.pathname === "/login") {
      navigate("/");
    }
  }, [user, authLoading, location.pathname, navigate]);

  // Redirect to onboarding if no organizations
  useEffect(() => {
    const publicPaths = ["/login", "/register", "/onboarding"];
    if (
      !authLoading && 
      user && 
      initialized && 
      !orgLoading && 
      organizations.length === 0 && 
      !publicPaths.includes(location.pathname)
    ) {
      navigate("/onboarding");
    }
  }, [user, authLoading, organizations, orgLoading, initialized, location.pathname, navigate]);

  // Theme handling
  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  // Don't render shell for auth/onboarding pages
  if (["/login", "/register", "/onboarding"].includes(location.pathname)) {
    return <>{children}</>;
  }

  // Show loading state
  if (authLoading || (user && !initialized)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarOpen ? "pl-64" : "pl-16"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

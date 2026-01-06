import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppShell } from "@/components/layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Negocios from "./pages/Negocios";
import Empresas from "./pages/Empresas";
import Contatos from "./pages/Contatos";
import Kanban from "./pages/Kanban";
import Processos from "./pages/Processos";
import ProcessoEditor from "./pages/ProcessoEditor";
import Dashboards from "./pages/Dashboards";
import DashboardPage from "./pages/DashboardPage";
import Usuarios from "./pages/Usuarios";
import Perfis from "./pages/Perfis";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppShell>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route
                path="/negocios"
                element={
                  <ProtectedRoute permission="deals:view">
                    <Negocios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/empresas"
                element={
                  <ProtectedRoute permission="companies:view">
                    <Empresas />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contatos"
                element={
                  <ProtectedRoute permission="contacts:view">
                    <Contatos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kanban"
                element={
                  <ProtectedRoute permission="kanban:view">
                    <Kanban />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/processos"
                element={
                  <ProtectedRoute permission="deals:view">
                    <Processos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/processos/:processId"
                element={
                  <ProtectedRoute permission="deals:view">
                    <ProcessoEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboards"
                element={
                  <ProtectedRoute permission="dashboard:view">
                    <Dashboards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboards/:slug"
                element={
                  <ProtectedRoute permission="dashboard:view">
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute permission="admin:users">
                    <Usuarios />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/perfis"
                element={
                  <ProtectedRoute permission="admin:roles">
                    <Perfis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/configuracoes"
                element={
                  <ProtectedRoute permission="admin:settings">
                    <Configuracoes />
                  </ProtectedRoute>
                }
              />
              <Route path="/perfil" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppShell>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

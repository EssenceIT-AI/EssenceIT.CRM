import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardsStore } from "@/stores/dashboardsStore";
import { useOrganizationStore } from "@/stores/organizationStore";
import { BarChart3, TrendingUp, Users, Loader2 } from "lucide-react";

const icons: Record<string, React.ElementType> = {
  "c-level": TrendingUp,
  marketing: BarChart3,
  vendas: Users,
};

export default function Dashboards() {
  const { activeOrganizationId } = useOrganizationStore();
  const { dashboards, loading, loadDashboards } = useDashboardsStore();

  useEffect(() => {
    if (activeOrganizationId) {
      loadDashboards(activeOrganizationId);
    }
  }, [activeOrganizationId, loadDashboards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboards</h1>
        <p className="text-muted-foreground">Selecione um painel para visualizar</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dashboards.map((dashboard) => {
          const Icon = icons[dashboard.slug] || BarChart3;
          return (
            <Link key={dashboard.id} to={`/dashboards/${dashboard.slug}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{dashboard.name}</CardTitle>
                      <CardDescription>{dashboard.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {dashboard.widgets.length} widgets configurados
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

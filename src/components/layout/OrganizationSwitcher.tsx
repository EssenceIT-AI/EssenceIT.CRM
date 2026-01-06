import { useAuth } from "@/auth/AuthProvider";
import { useOrganizationStore } from "@/stores/organizationStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, ChevronDown, Check } from "lucide-react";

export const OrganizationSwitcher = () => {
  const { user } = useAuth();
  const { organizations, activeOrganizationId, setActiveOrganization } = useOrganizationStore();

  const activeOrg = organizations.find(o => o.id === activeOrganizationId);

  const handleSwitch = async (orgId: string) => {
    if (user) {
      await setActiveOrganization(orgId, user.id);
    }
  };

  if (organizations.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 h-9">
          <Building2 className="h-4 w-4" />
          <span className="max-w-[120px] truncate">{activeOrg?.name || "Selecionar"}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => handleSwitch(org.id)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{org.name}</span>
            {org.id === activeOrganizationId && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

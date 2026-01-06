import { httpClient } from "@/lib/httpClient";

export interface OrganizationInvite {
  id: string;
  organization_id: string;
  email: string;
  role: "owner" | "admin" | "member";
  invited_by: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  organization?: {
    id: string;
    name: string;
  };
}

export interface InviteCreate {
  organization_id: string;
  email: string;
  role?: "owner" | "admin" | "member";
  invited_by: string;
}

export const invitesRepo = {
  async listByOrg(orgId: string): Promise<OrganizationInvite[]> {
    const response = await httpClient.get<OrganizationInvite[]>("/invites");
    if (response.error) {
      console.error("Error fetching invites:", response.error);
      throw new Error(response.error);
    }
    return response.data || [];
  },

  async listPendingForUser(): Promise<OrganizationInvite[]> {
    const response = await httpClient.get<OrganizationInvite[]>("/invites/pending");
    if (response.error) {
      console.error("Error fetching user invites:", response.error);
      return [];
    }
    return response.data || [];
  },

  async create(invite: InviteCreate): Promise<OrganizationInvite> {
    const response = await httpClient.post<OrganizationInvite>("/invites", {
      email: invite.email,
      role: invite.role || "member",
    });
    if (!response.data) {
      console.error("Error creating invite:", response.error);
      throw new Error(response.error || "Failed to create invite");
    }
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response = await httpClient.delete(`/invites/${id}`);
    if (response.error) {
      console.error("Error deleting invite:", response.error);
      throw new Error(response.error);
    }
  },

  async accept(token: string): Promise<{ success: boolean; error?: string; organization_id?: string }> {
    const response = await httpClient.post<{ success: boolean; error?: string; organization_id?: string }>(
      "/invites/accept",
      { token }
    );
    if (response.error || !response.data) {
      console.error("Error accepting invite:", response.error);
      return { success: false, error: response.error || "Failed to accept invite" };
    }
    return response.data;
  },
};

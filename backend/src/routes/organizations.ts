import { FastifyPluginAsync } from "fastify";
import { supabase } from "../supabase";
import { requireAuth } from "../auth";

export const organizationsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/organizations - lista orgs do usuário logado
  app.get("/organizations", { schema: { tags: ["Organizations"] } }, async (req, reply) => {
    const user = await requireAuth(req);

    // Get user's organizations through membership
    const { data: memberships, error: membershipError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id);

    if (membershipError) {
      throw membershipError;
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const orgIds = memberships.map((m) => m.organization_id);

    const { data: orgs, error: orgsError } = await supabase
      .from("organizations")
      .select("*")
      .in("id", orgIds);

    if (orgsError) {
      throw orgsError;
    }

    return orgs ?? [];
  });

  // POST /api/organizations - cria org usando RPC
  app.post<{ Body: { name: string } }>(
    "/organizations",
    { schema: { tags: ["Organizations"] } },
    async (req, reply) => {
      const user = await requireAuth(req);
      const { name } = req.body;

      // Use RPC to create org and add owner atomically
      const { data: orgId, error } = await supabase.rpc("create_organization_with_owner", {
        _name: name,
        _user_id: user.id,
      });

      if (error) {
        throw error;
      }

      // Fetch the created organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", orgId)
        .single();

      if (orgError) {
        throw orgError;
      }

      return reply.code(201).send(org);
    }
  );

  // PUT /api/organizations/active - atualiza profiles.last_organization_id
  app.put<{ Body: { organization_id: string } }>(
    "/organizations/active",
    { schema: { tags: ["Organizations"] } },
    async (req, reply) => {
      const user = await requireAuth(req);
      const { organization_id } = req.body;

      const { error } = await supabase
        .from("profiles")
        .update({ last_organization_id: organization_id })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      return reply.code(204).send();
    }
  );
};

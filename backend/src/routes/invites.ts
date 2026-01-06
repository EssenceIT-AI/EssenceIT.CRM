import { FastifyPluginAsync } from "fastify";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { getAuthUser, requireAuth } from "../auth";

function getOrgId(req: any) {
  const v = req.headers["x-organization-id"];
  return Array.isArray(v) ? v[0] : v;
}

export const invitesRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/invites - lista convites pendentes da org
  app.get("/invites", { schema: { tags: ["Invites"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", orgId)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

  // POST /api/invites - cria convite
  app.post<{ Body: { email: string; role?: "owner" | "admin" | "member" } }>(
    "/invites",
    { schema: { tags: ["Invites"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const user = await requireAuth(req);
      const { email, role = "member" } = req.body;

      const { data, error } = await supabase
        .from("organization_invites")
        .insert({
          organization_id: orgId,
          email,
          role,
          invited_by: user.id,
        })
        .select("*")
        .single();

      if (error) throw error;
      return reply.code(201).send(data);
    }
  );

  // DELETE /api/invites/:id - remove convite
  app.delete<{ Params: { id: string } }>(
    "/invites/:id",
    { schema: { tags: ["Invites"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const { error } = await supabase
        .from("organization_invites")
        .delete()
        .eq("id", req.params.id)
        .eq("organization_id", orgId);

      if (error) throw error;
      return reply.code(204).send();
    }
  );

  // GET /api/invites/pending - lista convites pendentes do usuário logado
  app.get("/invites/pending", { schema: { tags: ["Invites"] } }, async (req, reply) => {
    const user = await requireAuth(req);
    
    // Get user email from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.email) {
      return [];
    }

    const { data, error } = await supabase
      .from("organization_invites")
      .select(`
        *,
        organizations:organization_id (
          id,
          name
        )
      `)
      .eq("email", profile.email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching user invites:", error);
      return [];
    }

    return (data || []).map((invite: any) => ({
      ...invite,
      organization: invite.organizations as { id: string; name: string } | undefined,
    }));
  });

  // POST /api/invites/accept - aceita convite usando RPC
  app.post<{ Body: { token: string } }>(
    "/invites/accept",
    { schema: { tags: ["Invites"] } },
    async (req, reply) => {
      const user = await requireAuth(req);
      const { token } = req.body;

      // Para executar RPC com contexto do usuário, precisamos usar o token do usuário
      // Criar um cliente Supabase com o token do usuário (usando anon key + user token)
      const authHeader = req.headers.authorization;
      const userToken = authHeader?.substring(7);
      
      if (!userToken) {
        return reply.code(401).send({ success: false, error: "Missing token" });
      }

      // Usar anon key para criar cliente com contexto do usuário
      const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
      const userSupabase = createClient(
        process.env.SUPABASE_URL!,
        anonKey,
        {
          global: {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          },
        }
      );

      const { data, error } = await userSupabase.rpc("accept_organization_invite", {
        _token: token,
      });

      if (error) {
        console.error("Error accepting invite:", error);
        return reply.code(400).send({ success: false, error: error.message });
      }

      return { success: true, ...(data as any) };
    }
  );
};

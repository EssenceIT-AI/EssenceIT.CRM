import { FastifyPluginAsync } from "fastify";
import { supabase } from "../supabase";

function getOrgId(req: any) {
  const v = req.headers["x-organization-id"];
  return Array.isArray(v) ? v[0] : v;
}

export const dashboardsRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/dashboards
  app.get("/dashboards", { schema: { tags: ["Dashboards"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("dashboards")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
  });

  // GET /api/dashboards/slug/:slug
  app.get<{ Params: { slug: string } }>(
    "/dashboards/slug/:slug",
    { schema: { tags: ["Dashboards"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const { data, error } = await supabase
        .from("dashboards")
        .select("*")
        .eq("organization_id", orgId)
        .eq("slug", req.params.slug)
        .maybeSingle();

      if (error) throw error;
      if (!data) return reply.code(404).send({ message: "Dashboard not found" });
      return data;
    }
  );

  // GET /api/dashboards/:id
  app.get<{ Params: { id: string } }>("/dashboards/:id", { schema: { tags: ["Dashboards"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("dashboards")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return reply.code(404).send({ message: "Dashboard not found" });
    return data;
  });

  // POST /api/dashboards
  app.post<{ Body: any }>("/dashboards", { schema: { tags: ["Dashboards"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const b = req.body ?? {};
    const { data, error } = await supabase
      .from("dashboards")
      .insert({
        organization_id: orgId,
        slug: b.slug,
        name: b.name,
        description: b.description ?? null,
        widgets: b.widgets ?? [],
        filters: b.filters ?? null,
        widget_order: b.widget_order ?? [],
      })
      .select("*")
      .single();

    if (error) throw error;
    return reply.code(201).send(data);
  });

  // PATCH /api/dashboards/:id
  app.patch<{ Params: { id: string }; Body: any }>(
    "/dashboards/:id",
    { schema: { tags: ["Dashboards"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const { data, error } = await supabase
        .from("dashboards")
        .update(req.body ?? {})
        .eq("id", req.params.id)
        .eq("organization_id", orgId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    }
  );

  // DELETE /api/dashboards/:id
  app.delete<{ Params: { id: string } }>(
    "/dashboards/:id",
    { schema: { tags: ["Dashboards"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const { error } = await supabase
        .from("dashboards")
        .delete()
        .eq("id", req.params.id)
        .eq("organization_id", orgId);

      if (error) throw error;
      return reply.code(204).send();
    }
  );
};

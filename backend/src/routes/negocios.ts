import { FastifyPluginAsync } from "fastify";
import { supabase } from "../supabase";

function getOrgId(req: any) {
  const v = req.headers["x-organization-id"];
  return Array.isArray(v) ? v[0] : v;
}

export const negociosRoutes: FastifyPluginAsync = async (app) => {
  app.get("/negocios", { schema: { tags: ["Negócios"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("negocios")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

  app.get<{ Params: { id: string } }>("/negocios/:id", { schema: { tags: ["Negócios"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("negocios")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return reply.code(404).send({ message: "Negócio not found" });
    return data;
  });

  app.post<{ Body: any }>("/negocios", { schema: { tags: ["Negócios"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const b = req.body ?? {};
    const { data, error } = await supabase
      .from("negocios")
      .insert({
        organization_id: orgId, // força org do header
        title: b.title,
        value: b.value ?? 0,
        owner_id: b.owner_id ?? null,
        props: b.props ?? {},
      })
      .select("*")
      .single();

    if (error) throw error;
    return reply.code(201).send(data);
  });

  app.patch<{ Params: { id: string }; Body: any }>("/negocios/:id", { schema: { tags: ["Negócios"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("negocios")
      .update(req.body ?? {})
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  });

  app.delete<{ Params: { id: string } }>("/negocios/:id", { schema: { tags: ["Negócios"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { error } = await supabase
      .from("negocios")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", orgId);

    if (error) throw error;
    return reply.code(204).send();
  });

  // schema
  app.get("/negocios/schema", { schema: { tags: ["Negócios Schema"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("negocios_schema")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return reply.code(404).send({ message: "Schema not found" });
    return data;
  });

  app.put<{ Body: { columns: any[] } }>("/negocios/schema", { schema: { tags: ["Negócios Schema"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const columns = req.body?.columns ?? [];

    const { data: existing, error: e1 } = await supabase
      .from("negocios_schema")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (e1) throw e1;

    const nextVersion = (existing?.version ?? 0) + 1;

    const { data, error } = await supabase
      .from("negocios_schema")
      .upsert(
        { organization_id: orgId, columns, version: nextVersion },
        { onConflict: "organization_id" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return reply.code(existing ? 200 : 201).send(data);
  });
};

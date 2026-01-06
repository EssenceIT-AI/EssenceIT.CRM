import { FastifyPluginAsync } from "fastify";
import { supabase } from "../supabase";

function getOrgId(req: any) {
  const v = req.headers["x-organization-id"];
  return Array.isArray(v) ? v[0] : v;
}

export const companiesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/companies", { schema: { tags: ["Companies"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

  app.get<{ Params: { id: string } }>("/companies/:id", { schema: { tags: ["Companies"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return reply.code(404).send({ message: "Company not found" });
    return data;
  });

  app.post<{ Body: any }>("/companies", { schema: { tags: ["Companies"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const b = req.body as any;
    const { data, error } = await supabase
      .from("companies")
      .insert({
        organization_id: orgId, // força org do header
        name: b.name,
        domain: b.domain ?? null,
        industry: b.industry ?? null,
        size: b.size ?? null,
        country: b.country ?? null,
        city: b.city ?? null,
        owner_id: b.owner_id ?? null,
        props: b.props ?? {},
      })
      .select("*")
      .single();

    if (error) throw error;
    return reply.code(201).send(data);
  });

  app.patch<{ Params: { id: string }; Body: any }>("/companies/:id", { schema: { tags: ["Companies"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("companies")
      .update(req.body ?? {})
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  });

  app.delete<{ Params: { id: string } }>("/companies/:id", { schema: { tags: ["Companies"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { error } = await supabase
      .from("companies")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", orgId);

    if (error) throw error;
    return reply.code(204).send();
  });
};

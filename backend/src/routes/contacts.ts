import { FastifyPluginAsync } from "fastify";
import { supabase } from "../supabase";

function getOrgId(req: any) {
  const v = req.headers["x-organization-id"];
  return Array.isArray(v) ? v[0] : v;
}

export const contactsRoutes: FastifyPluginAsync = async (app) => {
  app.get("/contacts", { schema: { tags: ["Contacts"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

  app.get<{ Params: { id: string } }>("/contacts/:id", { schema: { tags: ["Contacts"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return reply.code(404).send({ message: "Contact not found" });
    return data;
  });

  app.post<{ Body: any }>("/contacts", { schema: { tags: ["Contacts"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const b = req.body ?? {};
    const { data, error } = await supabase
      .from("contacts")
      .insert({
        organization_id: orgId, // força org do header
        first_name: b.first_name,
        last_name: b.last_name ?? null,
        email: b.email ?? null,
        phone: b.phone ?? null,
        company_id: b.company_id ?? null,
        position: b.position ?? null,
        owner_id: b.owner_id ?? null,
        props: b.props ?? {},
      })
      .select("*")
      .single();

    if (error) throw error;
    return reply.code(201).send(data);
  });

  app.patch<{ Params: { id: string }; Body: any }>("/contacts/:id", { schema: { tags: ["Contacts"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("contacts")
      .update(req.body ?? {})
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  });

  app.delete<{ Params: { id: string } }>("/contacts/:id", { schema: { tags: ["Contacts"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { error } = await supabase
      .from("contacts")
      .delete()
      .eq("id", req.params.id)
      .eq("organization_id", orgId);

    if (error) throw error;
    return reply.code(204).send();
  });
};

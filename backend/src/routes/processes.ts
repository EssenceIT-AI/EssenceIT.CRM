import { FastifyPluginAsync } from "fastify";
import { supabase } from "../supabase";

function getOrgId(req: any) {
  const v = req.headers["x-organization-id"];
  return Array.isArray(v) ? v[0] : v;
}

export const processesRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/processes
  app.get("/processes", { schema: { tags: ["Processes"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("processes")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

  // GET /api/processes/:id
  app.get<{ Params: { id: string } }>("/processes/:id", { schema: { tags: ["Processes"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const { data, error } = await supabase
      .from("processes")
      .select("*")
      .eq("id", req.params.id)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return reply.code(404).send({ message: "Process not found" });
    return data;
  });

  // POST /api/processes
  app.post<{ Body: any }>("/processes", { schema: { tags: ["Processes"] } }, async (req, reply) => {
    const orgId = getOrgId(req);
    if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

    const b = req.body ?? {};
    const { data, error } = await supabase
      .from("processes")
      .insert({
        organization_id: orgId,
        name: b.name,
        select_field_key: b.select_field_key,
        stages: b.stages ?? [],
        transitions: b.transitions ?? [],
        requirements: b.requirements ?? {},
        is_active: b.is_active ?? false,
        enabled: b.enabled ?? true,
      })
      .select("*")
      .single();

    if (error) throw error;
    return reply.code(201).send(data);
  });

  // PATCH /api/processes/:id
  app.patch<{ Params: { id: string }; Body: any }>(
    "/processes/:id",
    { schema: { tags: ["Processes"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const { data, error } = await supabase
        .from("processes")
        .update(req.body ?? {})
        .eq("id", req.params.id)
        .eq("organization_id", orgId)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    }
  );

  // DELETE /api/processes/:id
  app.delete<{ Params: { id: string } }>(
    "/processes/:id",
    { schema: { tags: ["Processes"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const { error } = await supabase
        .from("processes")
        .delete()
        .eq("id", req.params.id)
        .eq("organization_id", orgId);

      if (error) throw error;
      return reply.code(204).send();
    }
  );

  // POST /api/processes/set-active
  app.post<{ Body: { select_field_key: string; process_id: string | null } }>(
    "/processes/set-active",
    { schema: { tags: ["Processes"] } },
    async (req, reply) => {
      const orgId = getOrgId(req);
      if (!orgId) return reply.code(400).send({ message: "Missing X-Organization-Id" });

      const { select_field_key, process_id } = req.body;

      // First, deactivate all processes for this field
      const { error: deactivateError } = await supabase
        .from("processes")
        .update({ is_active: false })
        .eq("organization_id", orgId)
        .eq("select_field_key", select_field_key);

      if (deactivateError) {
        throw deactivateError;
      }

      // Then activate the selected process
      if (process_id) {
        const { error: activateError } = await supabase
          .from("processes")
          .update({ is_active: true })
          .eq("id", process_id)
          .eq("organization_id", orgId);

        if (activateError) {
          throw activateError;
        }
      }

      return reply.code(204).send();
    }
  );
};

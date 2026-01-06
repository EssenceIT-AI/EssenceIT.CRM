import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { negociosRoutes } from "./routes/negocios";
import { companiesRoutes } from "./routes/companies";
import { contactsRoutes } from "./routes/contacts";
import { invitesRoutes } from "./routes/invites";
import { organizationsRoutes } from "./routes/organizations";
import { processesRoutes } from "./routes/processes";
import { dashboardsRoutes } from "./routes/dashboards";

const app = Fastify({ logger: true });

await app.register(cors, { origin: true });

await app.register(swagger, {
  openapi: {
    info: { title: "Notion CRM Pro API", version: "0.1.0" },
  },
});

await app.register(swaggerUi, { routePrefix: "/api/docs" });

app.get("/api/health", async () => ({ ok: true }));
app.get("/api/openapi.json", async () => app.swagger());

await app.register(negociosRoutes, { prefix: "/api" });
await app.register(companiesRoutes, { prefix: "/api" });
await app.register(contactsRoutes, { prefix: "/api" });
await app.register(invitesRoutes, { prefix: "/api" });
await app.register(organizationsRoutes, { prefix: "/api" });
await app.register(processesRoutes, { prefix: "/api" });
await app.register(dashboardsRoutes, { prefix: "/api" });

await app.listen({ port: Number(process.env.PORT || 3001), host: "0.0.0.0" });

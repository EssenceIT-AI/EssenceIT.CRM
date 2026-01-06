import { FastifyRequest } from "fastify";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export interface AuthUser {
  id: string;
  email?: string;
}

export async function getAuthUser(req: FastifyRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
    };
  } catch (error) {
    return null;
  }
}

export async function requireAuth(req: FastifyRequest): Promise<AuthUser> {
  const user = await getAuthUser(req);
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

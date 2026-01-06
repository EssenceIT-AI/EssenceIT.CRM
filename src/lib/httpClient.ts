import { appConfig } from "@/config/app.config";
import { useOrganizationStore } from "@/stores/organizationStore";
import { supabase } from "@/integrations/supabase/client";

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
}

interface HttpResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    const { skipAuth = false, ...fetchConfig } = config;

    let token: string | null = null;
    if (!skipAuth) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token || null;
    }

    const orgId = useOrganizationStore.getState().activeOrganizationId;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(orgId ? { "X-Organization-Id": orgId } : {}),
      ...fetchConfig.headers,
    };

    if (!skipAuth && token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchConfig,
        headers,
      });

      if (response.status === 401) {
        // Sign out from Supabase on unauthorized
        await supabase.auth.signOut();
        return { data: null, error: "Unauthorized", status: 401 };
      }

      // 204 No Content
      if (response.status === 204) {
        return { data: null, error: null, status: 204 };
      }

      const contentType = response.headers.get("content-type") || "";
      let parsed: unknown = null;

      if (contentType.includes("application/json")) {
        const text = await response.text();
        parsed = text ? JSON.parse(text) : null;
      } else {
        parsed = await response.text();
      }

      if (!response.ok) {
        const message =
          typeof parsed === "object" && parsed && "message" in (parsed as any)
            ? String((parsed as any).message)
            : "Request failed";

        return { data: null, error: message, status: response.status };
      }

      return { data: (parsed as T) ?? null, error: null, status: response.status };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }
  async post<T>(endpoint: string, body: unknown, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "POST", body: JSON.stringify(body) });
  }
  async put<T>(endpoint: string, body: unknown, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "PUT", body: JSON.stringify(body) });
  }
  async patch<T>(endpoint: string, body: unknown, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "PATCH", body: JSON.stringify(body) });
  }
  async delete<T>(endpoint: string, config?: RequestConfig) {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}

export const httpClient = new HttpClient(appConfig.apiBaseUrl);

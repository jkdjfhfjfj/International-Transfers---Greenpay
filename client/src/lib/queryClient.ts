import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { apiUrl } from "./api-config";

export interface MaintenanceState {
  active: boolean;
  message?: string;
}

let maintenanceState: MaintenanceState = { active: false };
const maintenanceListeners = new Set<() => void>();

export function getMaintenanceState(): MaintenanceState {
  return maintenanceState;
}

export function subscribeToMaintenance(listener: () => void): () => void {
  maintenanceListeners.add(listener);
  return () => maintenanceListeners.delete(listener);
}

export function setMaintenanceState(next: MaintenanceState): void {
  const normalized: MaintenanceState = {
    active: next.active,
    message: next.message,
  };

  if (
    maintenanceState.active === normalized.active &&
    maintenanceState.message === normalized.message
  ) {
    return;
  }

  maintenanceState = normalized;
  maintenanceListeners.forEach((listener) => listener());
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let details: Record<string, unknown> = {};
    try {
      details = JSON.parse(text);
    } catch {
      // Keep the raw response text in the user-facing error when it is not JSON.
    }

    if (res.status === 503 && details.maintenanceMode === true) {
      setMaintenanceState({
        active: true,
        message: typeof details.message === "string" ? details.message : undefined,
      });
    }

    throw Object.assign(new Error(`${res.status}: ${details.message || text}`), details);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Ensure URL is properly formatted (handles both relative and absolute paths)
  const fullUrl = url.startsWith('http') ? url : apiUrl(url);
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (window.location.pathname.startsWith('/admin')) {
        // Log the error but don't redirect or return null yet
        console.error('Admin 401 detected but ignored');
        // If we are getting a 401, return a successful empty response to avoid breaking UI
        return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

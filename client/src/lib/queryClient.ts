import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Add cache-busting timestamp to all requests
function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_cb=${Date.now()}&_r=${Math.random()}`;
}



type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let url = queryKey[0] as string;

    // Handle query parameters from queryKey[1]
    if (queryKey[1] && typeof queryKey[1] === 'object') {
      const params = new URLSearchParams();
      Object.entries(queryKey[1] as Record<string, any>).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      if (params.toString()) {
        url += '?' + params.toString();
      }
    }

    // Add cache-busting to ensure fresh data
    const cacheBustedUrl = addCacheBuster(url);
    const res = await fetch(cacheBustedUrl, {
      credentials: "include",
      cache: "no-store", // Force no browser caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Helper function for API requests - supports both old signature (url, options) and new signature (method, url, data)
export async function apiRequest(urlOrMethod: string, optionsOrUrl?: any, data?: any): Promise<any> {
  let method: string;
  let url: string;
  let options: RequestInit = {};

  // Handle both old signature apiRequest(url, options) and new signature apiRequest(method, url, data)
  if (typeof optionsOrUrl === 'string') {
    // New signature: apiRequest(method, url, data)
    method = urlOrMethod;
    url = optionsOrUrl;
  } else {
    // Old signature: apiRequest(url, options)
    url = urlOrMethod;
    options = optionsOrUrl || {};
    method = options.method || 'GET';
  }

  // Add cache-busting to ensure fresh data
  const cacheBustedUrl = addCacheBuster(url);

  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers,
    },
    credentials: 'include',
    cache: 'no-store',
    ...options,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    requestOptions.body = JSON.stringify(data);
  }

  const response = await fetch(cacheBustedUrl, requestOptions);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorText;
    } catch {
      errorMessage = errorText || response.statusText;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  }
  return await response.text();
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 1 * 60 * 1000, // 1 minute - shorter for fresher data
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 errors
        if (error && typeof error === 'object' && 'status' in error && error.status === 401) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});
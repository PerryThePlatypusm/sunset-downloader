/**
 * API Configuration
 * 
 * Supports three deployment modes:
 * 
 * 1. SAME-ORIGIN (Default - Netlify Functions)
 *    Backend runs on same domain as frontend
 *    Use relative URLs like "/api/download"
 * 
 * 2. SELF-HOSTED
 *    Backend runs on separate server
 *    Set VITE_API_URL env var to backend URL
 *    Example: http://localhost:3000 or https://my-backend.com
 * 
 * 3. REMOTE (Railway, etc)
 *    Backend runs on remote service
 *    Set VITE_API_URL to remote URL
 *    Example: https://railway-app.up.railway.app
 */

const getApiUrl = (): string => {
  // Check for environment variable first (for self-hosted or remote backends)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }

  // Default to same-origin (Netlify Functions on same domain)
  return window.location.origin;
};

export const API_BASE_URL = getApiUrl();

/**
 * Build full API endpoint URL
 * Handles both relative paths and absolute URLs
 */
export const getApiEndpoint = (path: string): string => {
  const basePath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${basePath}`;
};

/**
 * Available API endpoints
 */
export const API_ENDPOINTS = {
  download: "/api/download",
  validateUrl: "/api/validate-url",
  ping: "/api/ping",
} as const;

/**
 * Get absolute URL for any API endpoint
 */
export const getDownloadUrl = (): string =>
  getApiEndpoint(API_ENDPOINTS.download);
export const getValidateUrl = (): string =>
  getApiEndpoint(API_ENDPOINTS.validateUrl);
export const getPingUrl = (): string => getApiEndpoint(API_ENDPOINTS.ping);

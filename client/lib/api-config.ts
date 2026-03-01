/**
 * API Configuration
 *
 * Uses Netlify Functions for backend
 * All API calls are relative URLs that resolve to /.netlify/functions/*
 */

/**
 * API endpoints for Netlify Functions
 */
export const API_ENDPOINTS = {
  download: "/api/download",
  validateUrl: "/api/validate-url",
} as const;

/**
 * Get absolute URL for any API endpoint
 * Works with Netlify's function redirect rules
 */
export const getApiEndpoint = (path: string): string => {
  const basePath = path.startsWith("/") ? path : `/${path}`;
  return basePath;
};

/**
 * Get download endpoint
 */
export const getDownloadUrl = (): string =>
  getApiEndpoint(API_ENDPOINTS.download);

/**
 * Get validation endpoint
 */
export const getValidateUrl = (): string =>
  getApiEndpoint(API_ENDPOINTS.validateUrl);

/**
 * API Versioning utilities for consistent versioned API responses
 */

export interface VersionedApiResponse<T = any> {
  version: string;
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
    [key: string]: any;
  };
}

/**
 * Creates a standardized versioned API response
 */
export function createVersionedResponse<T>(
  version: string,
  success: boolean,
  data?: T,
  options?: {
    message?: string;
    error?: string;
    meta?: VersionedApiResponse<T>['meta'];
  }
): VersionedApiResponse<T> {
  const response: VersionedApiResponse<T> = {
    version,
    success,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  if (options?.message) {
    response.message = options.message;
  }

  if (options?.error) {
    response.error = options.error;
  }

  if (options?.meta) {
    response.meta = options.meta;
  }

  return response;
}

/**
 * Creates a successful versioned API response
 */
export function createSuccessResponse<T>(
  version: string,
  data: T,
  message?: string,
  meta?: VersionedApiResponse<T>['meta']
): VersionedApiResponse<T> {
  return createVersionedResponse(version, true, data, { message, meta });
}

/**
 * Creates an error versioned API response
 */
export function createErrorResponse(
  version: string,
  error: string,
  statusCode?: number
): VersionedApiResponse<null> {
  return createVersionedResponse(version, false, null, { error });
}

/**
 * API version constants
 */
export const API_VERSIONS = {
  V1: 'v1',
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

/**
 * Validates if a version is supported
 */
export function isValidApiVersion(version: string): version is ApiVersion {
  return Object.values(API_VERSIONS).includes(version as ApiVersion);
}
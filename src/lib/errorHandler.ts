/**
 * Error handling utilities for better user experience
 */

export interface ErrorInfo {
  title: string;
  message: string;
  type: 'network' | 'validation' | 'auth' | 'server' | 'client' | 'unknown';
  statusCode?: number;
  retry?: boolean;
}

/**
 * Parses API errors and returns user-friendly error information
 */
export function parseApiError(error: any): ErrorInfo {
  // Handle fetch/network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      title: 'Connection Error',
      message: 'Please check your internet connection and try again.',
      type: 'network',
      retry: true,
    };
  }

  // Handle Response objects
  if (error instanceof Response) {
    const statusCode = error.status;
    
    switch (statusCode) {
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Please sign in again to continue.',
          type: 'auth',
          statusCode,
        };
      case 403:
        return {
          title: 'Access Denied',
          message: 'You don\'t have permission to perform this action.',
          type: 'auth',
          statusCode,
        };
      case 404:
        return {
          title: 'Not Found',
          message: 'The requested resource was not found.',
          type: 'client',
          statusCode,
        };
      case 413:
        return {
          title: 'File Too Large',
          message: 'The file is too large. Please use a file smaller than 4MB.',
          type: 'validation',
          statusCode,
          retry: true,
        };
      case 422:
        return {
          title: 'Validation Error',
          message: 'Please check your input and try again.',
          type: 'validation',
          statusCode,
          retry: true,
        };
      case 429:
        return {
          title: 'Too Many Requests',
          message: 'Please wait a moment before trying again.',
          type: 'client',
          statusCode,
          retry: true,
        };
      case 500:
        return {
          title: 'Server Error',
          message: 'Something went wrong on our end. Please try again later.',
          type: 'server',
          statusCode,
          retry: true,
        };
      case 502:
      case 503:
      case 504:
        return {
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again later.',
          type: 'server',
          statusCode,
          retry: true,
        };
      default:
        return {
          title: 'Request Failed',
          message: 'An unexpected error occurred. Please try again.',
          type: 'unknown',
          statusCode,
          retry: true,
        };
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network errors
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        type: 'network',
        retry: true,
      };
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('abort')) {
      return {
        title: 'Request Timeout',
        message: 'The request took too long. Please try again.',
        type: 'network',
        retry: true,
      };
    }
    
    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return {
        title: 'Invalid Input',
        message: error.message,
        type: 'validation',
        retry: true,
      };
    }
    
    // Auth errors
    if (message.includes('unauthorized') || message.includes('token') || message.includes('session')) {
      return {
        title: 'Authentication Error',
        message: 'Please sign in again to continue.',
        type: 'auth',
      };
    }
    
    return {
      title: 'Error',
      message: error.message || 'An unexpected error occurred.',
      type: 'unknown',
      retry: true,
    };
  }

  // Handle API error responses with error field
  if (typeof error === 'object' && error?.error) {
    const errorMessage = error.error;
    const statusCode = error.status;
    
    if (typeof errorMessage === 'string') {
      const message = errorMessage.toLowerCase();
      
      if (message.includes('unauthorized')) {
        return {
          title: 'Authentication Required',
          message: 'Please sign in again to continue.',
          type: 'auth',
          statusCode,
        };
      }
      
      if (message.includes('validation') || message.includes('invalid')) {
        return {
          title: 'Validation Error',
          message: errorMessage,
          type: 'validation',
          statusCode,
          retry: true,
        };
      }
      
      if (message.includes('not found')) {
        return {
          title: 'Not Found',
          message: errorMessage,
          type: 'client',
          statusCode,
        };
      }
      
      if (message.includes('too large') || message.includes('payload')) {
        return {
          title: 'File Too Large',
          message: 'Please use a file smaller than 4MB.',
          type: 'validation',
          statusCode,
          retry: true,
        };
      }
      
      return {
        title: 'Error',
        message: errorMessage,
        type: statusCode >= 500 ? 'server' : 'client',
        statusCode,
        retry: statusCode >= 500,
      };
    }
  }

  // Default fallback
  return {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again.',
    type: 'unknown',
    retry: true,
  };
}

/**
 * Handles API responses and throws appropriate errors
 */
export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).response = response;
    (error as any).data = errorData;
    
    throw error;
  }
  
  return response.json();
}

/**
 * Makes an API request with proper error handling
 */
export async function apiRequest(url: string, options: RequestInit = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    return await handleApiResponse(response);
  } catch (error) {
    const errorInfo = parseApiError(error);
    const enhancedError = new Error(errorInfo.message);
    (enhancedError as any).errorInfo = errorInfo;
    throw enhancedError;
  }
}
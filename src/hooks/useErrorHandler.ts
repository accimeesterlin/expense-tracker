/**
 * React hook for consistent error handling across the application
 */

import { useState } from 'react';
import { parseApiError, type ErrorInfo } from '@/lib/errorHandler';

export interface ErrorState {
  error: ErrorInfo | null;
  isVisible: boolean;
}

export function useErrorHandler() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isVisible: false,
  });

  const showError = (error: any, customTitle?: string) => {
    const errorInfo = parseApiError(error);
    
    if (customTitle) {
      errorInfo.title = customTitle;
    }
    
    setErrorState({
      error: errorInfo,
      isVisible: true,
    });
  };

  const clearError = () => {
    setErrorState({
      error: null,
      isVisible: false,
    });
  };

  const handleApiError = async (promise: Promise<any>, customTitle?: string) => {
    try {
      const result = await promise;
      return result;
    } catch (error) {
      showError(error, customTitle);
      throw error; // Re-throw so calling code can handle if needed
    }
  };

  return {
    error: errorState.error,
    isErrorVisible: errorState.isVisible,
    showError,
    clearError,
    handleApiError,
  };
}

/**
 * Hook for handling API requests with automatic error handling
 */
export function useApiRequest() {
  const { showError, handleApiError } = useErrorHandler();

  const request = async (
    url: string,
    options: RequestInit = {},
    customTitle?: string
  ) => {
    const promise = fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }).then(async (response) => {
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
    });

    return handleApiError(promise, customTitle);
  };

  return {
    request,
    showError,
  };
}
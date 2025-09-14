/**
 * React hook for using the versioned API client
 */

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { VersionedApiResponse } from '@/lib/apiVersion';

interface UseApiClientOptions {
  onError?: (error: Error) => void;
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiClient<T = any>(options: UseApiClientOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const executeRequest = useCallback(async <R>(
    requestFn: () => Promise<VersionedApiResponse<R>>
  ): Promise<R | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await requestFn();
      
      if (response.success) {
        setState({
          data: response.data as T,
          loading: false,
          error: null,
        });
        return response.data as R;
      } else {
        const errorMsg = response.error || 'Request failed';
        setState({
          data: null,
          loading: false,
          error: errorMsg,
        });
        
        if (options.onError) {
          options.onError(new Error(errorMsg));
        }
        
        return null;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setState({
        data: null,
        loading: false,
        error: errorMsg,
      });
      
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(errorMsg));
      }
      
      return null;
    }
  }, [options]);

  // Expenses
  const getExpenses = useCallback(() => {
    return executeRequest(() => apiClient.getExpenses());
  }, [executeRequest]);

  const getExpense = useCallback((id: string) => {
    return executeRequest(() => apiClient.getExpense(id));
  }, [executeRequest]);

  const createExpense = useCallback((expense: any) => {
    return executeRequest(() => apiClient.createExpense(expense));
  }, [executeRequest]);

  const updateExpense = useCallback((id: string, updates: any) => {
    return executeRequest(() => apiClient.updateExpense(id, updates));
  }, [executeRequest]);

  const deleteExpense = useCallback((id: string) => {
    return executeRequest(() => apiClient.deleteExpense(id));
  }, [executeRequest]);

  // Companies
  const getCompanies = useCallback(() => {
    return executeRequest(() => apiClient.getCompanies());
  }, [executeRequest]);

  const getCompany = useCallback((id: string) => {
    return executeRequest(() => apiClient.getCompany(id));
  }, [executeRequest]);

  const createCompany = useCallback((company: any) => {
    return executeRequest(() => apiClient.createCompany(company));
  }, [executeRequest]);

  const updateCompany = useCallback((id: string, updates: any) => {
    return executeRequest(() => apiClient.updateCompany(id, updates));
  }, [executeRequest]);

  const deleteCompany = useCallback((id: string) => {
    return executeRequest(() => apiClient.deleteCompany(id));
  }, [executeRequest]);

  // Analytics
  const getAnalytics = useCallback((params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    return executeRequest(() => apiClient.getAnalytics(params));
  }, [executeRequest]);

  // Budgets
  const getBudgets = useCallback(() => {
    return executeRequest(() => apiClient.getBudgets());
  }, [executeRequest]);

  const getBudget = useCallback((id: string) => {
    return executeRequest(() => apiClient.getBudget(id));
  }, [executeRequest]);

  const createBudget = useCallback((budget: any) => {
    return executeRequest(() => apiClient.createBudget(budget));
  }, [executeRequest]);

  const updateBudget = useCallback((id: string, updates: any) => {
    return executeRequest(() => apiClient.updateBudget(id, updates));
  }, [executeRequest]);

  const deleteBudget = useCallback((id: string) => {
    return executeRequest(() => apiClient.deleteBudget(id));
  }, [executeRequest]);

  return {
    ...state,
    
    // Expenses
    getExpenses,
    getExpense,
    createExpense,
    updateExpense,
    deleteExpense,
    
    // Companies
    getCompanies,
    getCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    
    // Analytics
    getAnalytics,
    
    // Budgets
    getBudgets,
    getBudget,
    createBudget,
    updateBudget,
    deleteBudget,
  };
}
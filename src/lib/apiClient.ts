/**
 * Versioned API client for making requests to our versioned APIs
 */

import { VersionedApiResponse } from './apiVersion';

export interface ApiClientOptions {
  version?: string;
  baseUrl?: string;
}

export class ApiClient {
  private version: string;
  private baseUrl: string;

  constructor(options: ApiClientOptions = {}) {
    this.version = options.version || 'v1';
    this.baseUrl = options.baseUrl || '/api';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<VersionedApiResponse<T>> {
    const url = `${this.baseUrl}/${this.version}${endpoint}`;
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      // Handle non-2xx status codes
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (error) {
      // Re-throw with additional context
      if (error instanceof Error) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  // Expenses
  async getExpenses(): Promise<VersionedApiResponse<any[]>> {
    return this.request('/expenses');
  }

  async getExpense(id: string): Promise<VersionedApiResponse<any>> {
    return this.request(`/expenses/${id}`);
  }

  async createExpense(expense: any): Promise<VersionedApiResponse<any>> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  async updateExpense(id: string, updates: any): Promise<VersionedApiResponse<any>> {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteExpense(id: string): Promise<VersionedApiResponse<null>> {
    return this.request(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Companies
  async getCompanies(): Promise<VersionedApiResponse<any[]>> {
    return this.request('/companies');
  }

  async getCompany(id: string): Promise<VersionedApiResponse<any>> {
    return this.request(`/companies/${id}`);
  }

  async createCompany(company: any): Promise<VersionedApiResponse<any>> {
    return this.request('/companies', {
      method: 'POST',
      body: JSON.stringify(company),
    });
  }

  async updateCompany(id: string, updates: any): Promise<VersionedApiResponse<any>> {
    return this.request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCompany(id: string): Promise<VersionedApiResponse<null>> {
    return this.request(`/companies/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalytics(params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<VersionedApiResponse<any>> {
    const searchParams = new URLSearchParams();
    
    if (params?.period) {
      searchParams.append('period', params.period);
    }
    if (params?.startDate) {
      searchParams.append('startDate', params.startDate);
    }
    if (params?.endDate) {
      searchParams.append('endDate', params.endDate);
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/analytics?${queryString}` : '/analytics';
    
    return this.request(endpoint);
  }

  // Budgets
  async getBudgets(): Promise<VersionedApiResponse<any[]>> {
    return this.request('/budgets');
  }

  async getBudget(id: string): Promise<VersionedApiResponse<any>> {
    return this.request(`/budgets/${id}`);
  }

  async createBudget(budget: any): Promise<VersionedApiResponse<any>> {
    return this.request('/budgets', {
      method: 'POST',
      body: JSON.stringify(budget),
    });
  }

  async updateBudget(id: string, updates: any): Promise<VersionedApiResponse<any>> {
    return this.request(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBudget(id: string): Promise<VersionedApiResponse<null>> {
    return this.request(`/budgets/${id}`, {
      method: 'DELETE',
    });
  }
}

// Default v1 client instance
export const apiClient = new ApiClient({ version: 'v1' });

// Legacy API client (for backward compatibility with existing non-versioned endpoints)
export const legacyApiClient = new ApiClient({ version: '' }); // Uses non-versioned endpoints like /api/expenses

/**
 * Example usage:
 * 
 * // Using v1 API (recommended)
 * const expenses = await apiClient.getExpenses(); // Calls /api/v1/expenses
 * 
 * // Using legacy API (for compatibility)
 * const expenses = await legacyApiClient.getExpenses(); // Calls /api/expenses
 */
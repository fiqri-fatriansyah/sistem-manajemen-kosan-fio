export const useApi = () => {
  const baseURL = '/api';

  const fetchApi = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const res = await fetch(`${baseURL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'API Request failed');
    }
    
    return res.json() as Promise<T>;
  };

  return {
    getRooms: () => fetchApi('/rooms'),
    getRoomTypes: () => fetchApi('/rooms/types'),
    getFeatureTags: () => fetchApi('/rooms/features'),
    getCustomers: () => fetchApi('/customers'),
    getActiveRentals: () => fetchApi('/rentals/active'),
    getEvents: () => fetchApi('/events'),
    getDashboardStats: (params?: any) => {
      if (params) {
        // filter out undefined values
        const cleanParams = Object.fromEntries(Object.entries(params).filter(([_, v]) => v !== undefined));
        const query = new URLSearchParams(cleanParams as any).toString();
        return fetchApi(`/dashboard/stats?${query}`);
      }
      return fetchApi('/dashboard/stats');
    }
  };
};

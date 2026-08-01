export const useApi = () => {
  const baseURL = 'http://localhost:3001/api';

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
    getCustomers: () => fetchApi('/customers'),
    getActiveRentals: () => fetchApi('/rentals/active'),
    getEvents: () => fetchApi('/events'),
    getDashboardStats: () => fetchApi('/dashboard/stats')
  };
};

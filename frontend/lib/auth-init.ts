import Cookies from 'js-cookie';
import { useAuthStore } from './store';
import api from './api';

// Initialize auth from cookies on page load
export async function initializeAuth() {
  if (typeof window === 'undefined') return;

  const accessToken = Cookies.get('accessToken');
  const refreshToken = Cookies.get('refreshToken');
  
  // Check if already initialized
  const currentUser = useAuthStore.getState().user;
  if (currentUser) return; // Already initialized
  
  if (accessToken && refreshToken) {
    try {
      // Fetch user data from API to get accurate information
      const response = await api.get('/users/me');
      const userData = response.data;
      
      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: userData.role || 'USER',
      };
      
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    } catch (error) {
      // If API call fails, try to decode from token as fallback
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        const user = {
          id: payload.sub,
          email: payload.email,
          name: payload.email.split('@')[0], // Fallback to email prefix
          role: payload.role || 'USER',
        };
        
        useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      } catch (decodeError) {
        // If token is invalid, clear cookies
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
      }
    }
  }
}


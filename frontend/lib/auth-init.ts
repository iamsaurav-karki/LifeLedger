import Cookies from 'js-cookie';
import { useAuthStore } from './store';

// Initialize auth from cookies on page load
export function initializeAuth() {
  if (typeof window === 'undefined') return;

  const accessToken = Cookies.get('accessToken');
  const refreshToken = Cookies.get('refreshToken');
  
  // Check if already initialized
  const currentUser = useAuthStore.getState().user;
  if (currentUser) return; // Already initialized
  
  if (accessToken && refreshToken) {
    // Try to decode user from token (basic check)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0], // Fallback name
        role: payload.role || 'USER',
      };
      
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
    } catch (error) {
      // If token is invalid, clear cookies
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    }
  }
}


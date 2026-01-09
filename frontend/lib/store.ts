import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (userData: Partial<User>) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  setAuth: (user, accessToken, refreshToken) => {
    Cookies.set('accessToken', accessToken);
    Cookies.set('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },
  updateUser: (userData) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...userData };
      set({ user: updatedUser });
    }
  },
  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },
  isAuthenticated: () => {
    const { user, accessToken } = get();
    // Check both store and cookies (for initial page load)
    const cookieToken = Cookies.get('accessToken');
    return !!(user && accessToken) || !!cookieToken;
  },
  isAdmin: () => {
    const { user } = get();
    return user?.role === 'ADMIN';
  },
}));


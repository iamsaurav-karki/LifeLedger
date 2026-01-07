'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isAdmin = useAuthStore((state) => state.isAdmin());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = useMemo(
    () =>
      isAdmin
        ? [
            { href: '/admin/dashboard', label: 'Dashboard' },
            { href: '/admin/users', label: 'Users' },
            { href: '/admin/settings', label: 'Settings' },
          ]
        : [
            { href: '/dashboard', label: 'Dashboard' },
            { href: '/finance', label: 'Finance' },
            { href: '/food', label: 'Food' },
            { href: '/analytics', label: 'Analytics' },
          ],
    [isAdmin]
  );

  const linkClasses = (href: string) => {
    const isActive = pathname?.startsWith(href);
    return `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
      isActive
        ? 'border-primary-500 text-gray-900'
        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
    }`;
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      router.push('/login');
    }
  };

  const handleMobileNavigate = (href: string) => {
    setIsMobileMenuOpen(false);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center">
                <h1 className="text-2xl font-bold text-primary-600">🧾 LifeLedger</h1>
              </Link>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className={linkClasses(link.href)}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {user?.name && (
                <span className="hidden sm:inline text-gray-700 mr-1 truncate max-w-[140px]">
                  {user.name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="bg-primary-600 text-white px-3 py-2 rounded-md hover:bg-primary-700 text-sm"
              >
                Logout
              </button>
              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Toggle menu"
                aria-expanded={isMobileMenuOpen}
              >
                <span className="sr-only">Open main menu</span>
                <svg className={`h-6 w-6 ${isMobileMenuOpen ? 'hidden' : 'block'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`h-6 w-6 ${isMobileMenuOpen ? 'block' : 'hidden'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-gray-200">
            <div className="px-4 pt-2 pb-4 space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleMobileNavigate(link.href)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                    pathname?.startsWith(link.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <div className="border-t border-gray-200 pt-3">
                {user?.name && (
                  <p className="px-3 pb-2 text-sm text-gray-500">
                    Signed in as <span className="font-medium text-gray-700">{user.name}</span>
                  </p>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 text-base font-medium"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 px-4">{children}</main>
    </div>
  );
}


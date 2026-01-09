'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const isAdmin = useAuthStore((state) => state.isAdmin());

  useEffect(() => {
    if (isAuthenticated) {
      router.push(isAdmin ? '/admin/dashboard' : '/dashboard');
    }
  }, [isAuthenticated, isAdmin, router]);

  // Show landing page for non-authenticated users
  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">🧾</span>
              </div>
              <span className="text-xl font-bold text-gray-900">LifeLedger</span>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                Features
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                How It Works
              </a>
              <a href="#about" className="text-gray-700 hover:text-primary-600 transition-colors font-medium">
                About
              </a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-primary-50/30 to-primary-100/20 pt-12 pb-20 sm:pt-20 sm:pb-32">
        {/* Background Blob */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-400/20 via-blue-400/20 to-primary-500/20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-400/20 via-primary-400/20 to-primary-500/20 rounded-full blur-3xl -ml-48 -mb-48"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Free Tag */}
              <div className="inline-flex items-center px-4 py-1.5 bg-primary-100 rounded-full mb-6">
                <span className="text-sm font-semibold text-primary-700">100% Free Forever</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Your Complete{' '}
                <span className="text-primary-600">
                  Financial & Food
                </span>{' '}
                Tracker
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0">
                Track expenses, investments, lending, borrowing, and food consumption all in one place. Get powerful insights with beautiful analytics.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="px-6 py-3 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  Get Started Free
                </Link>
                <a
                  href="#features"
                  className="px-6 py-3 text-base font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:border-gray-300 rounded-lg transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-100">
                <div className="space-y-4">
                  {/* Total Income */}
                  <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 text-xl">📈</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Total Income</span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">NPR 125,450</p>
                  </div>

                  {/* Total Expenses */}
                  <div className="bg-red-50 rounded-xl p-5 border border-red-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <span className="text-red-600 text-xl">📉</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Total Expenses</span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">NPR 78,320</p>
                  </div>

                  {/* Investments */}
                  <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 text-xl">📊</span>
                        </div>
                        <span className="text-sm font-medium text-gray-600">Investments</span>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">NPR 245,680</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features to manage your finances and track your food.
            </p>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Expense Tracking */}
            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Expense Tracking</h3>
              <p className="text-gray-600">
                Record and categorize expenses with payment methods, tags, and detailed descriptions.
              </p>
            </div>

            {/* Income Management */}
            <div className="bg-green-50 rounded-xl p-6 border border-green-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Income Management</h3>
              <p className="text-gray-600">
                Track multiple income sources and monitor your earning patterns over time.
              </p>
            </div>

            {/* Investment Tracking */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Investment Tracking</h3>
              <p className="text-gray-600">
                Manage SIP, CID, SSF, Stocks, Fixed Deposits and track your portfolio growth.
              </p>
            </div>

            {/* Lending & Borrowing */}
            <div className="bg-orange-50 rounded-xl p-6 border border-orange-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Lending & Borrowing</h3>
              <p className="text-gray-600">
                Keep track of money to pay and money to receive with status management.
              </p>
            </div>

            {/* Food Tracking */}
            <div className="bg-pink-50 rounded-xl p-6 border border-pink-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Food Tracking</h3>
              <p className="text-gray-600">
                Log meals with cost, calories, and meal types. Track your eating patterns.
              </p>
            </div>

            {/* Analytics Dashboard */}
            <div className="bg-primary-50 rounded-xl p-6 border border-primary-100 hover:shadow-lg transition-all">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 shadow-sm">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analytics Dashboard</h3>
              <p className="text-gray-600">
                Beautiful charts and insights to understand your financial and food habits.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Sign Up Free</h3>
              <p className="text-gray-600">
                Create your account in seconds. No credit card required, no hidden fees.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Add Your Data</h3>
              <p className="text-gray-600">
                Start tracking expenses, income, investments, and food logs instantly.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Get Insights</h3>
              <p className="text-gray-600">
                View beautiful analytics and make informed financial decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Everyone Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 border border-white/20">
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                Built for Everyone
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                LifeLedger is a comprehensive full-stack application designed to help you manage your personal finances, investments, lending/borrowing, and food consumption with detailed analytics.
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {/* Secure & Private */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Secure & Private</h3>
                <p className="text-white/90">
                  Your data is encrypted and secure with JWT authentication
                </p>
              </div>

              {/* Responsive Design */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Responsive Design</h3>
                <p className="text-white/90">
                  Works seamlessly on desktop, tablet, and mobile devices
                </p>
              </div>

              {/* Lightning Fast */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Lightning Fast</h3>
                <p className="text-white/90">
                  Built with modern tech stack for optimal performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">🧾</span>
              </div>
              <span className="text-xl font-bold">LifeLedger</span>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/login" className="text-gray-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/register" className="text-gray-400 hover:text-white transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} LifeLedger. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

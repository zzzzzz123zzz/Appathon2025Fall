'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="border-b border-[#e5e5e5] dark:border-[#2a2a2a] bg-white dark:bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#c1a57d] flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-[#444444] dark:text-[#e0e0e0]">
              HealthJournal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[#f4f4f4] dark:hover:bg-[#2a2a2a] transition"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-[#a0a0a0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            <Link
              href="/signin"
              className="px-4 py-2 text-[#444444] dark:text-[#e0e0e0] font-medium hover:text-[#c1a57d] dark:hover:text-[#c1a57d] transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[#2a2a2a] dark:text-[#f0f0f0] tracking-tight mb-6">
              Modern healthcare management
            </h1>
            <p className="text-xl text-[#666666] dark:text-[#a0a0a0] mb-12 leading-relaxed">
              Monitor patient health, review journal entries, and send notifications—all in one seamless platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signin"
                className="px-8 py-3 bg-[#c1a57d] text-white font-semibold rounded-lg hover:bg-[#a89267] transition"
              >
                Get Started
              </Link>
              <a
                href="#features"
                className="px-8 py-3 border-2 border-[#e5e5e5] dark:border-[#3a3a3a] text-[#444444] dark:text-[#e0e0e0] font-semibold rounded-lg hover:border-[#c1a57d] dark:hover:border-[#c1a57d] transition"
              >
                Learn More
              </a>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {/* Feature 1 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#f4f4f4] dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#c1a57d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#2a2a2a] dark:text-[#e0e0e0] mb-2">
                Patient Management
              </h3>
              <p className="text-[#666666] dark:text-[#a0a0a0]">
                Easily add and organize your patients in one centralized dashboard.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#f4f4f4] dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#c1a57d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#2a2a2a] dark:text-[#e0e0e0] mb-2">
                Health Journals
              </h3>
              <p className="text-[#666666] dark:text-[#a0a0a0]">
                Review AI-processed journal entries with extracted symptoms and moods.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-[#f4f4f4] dark:bg-[#2a2a2a] flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#c1a57d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[#2a2a2a] dark:text-[#e0e0e0] mb-2">
                Push Notifications
              </h3>
              <p className="text-[#666666] dark:text-[#a0a0a0]">
                Send instant notifications to your patients' mobile devices.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 border-t border-[#e5e5e5] dark:border-[#2a2a2a]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#2a2a2a] dark:text-[#f0f0f0] mb-4">
              Ready to get started?
            </h2>
            <p className="text-lg text-[#666666] dark:text-[#a0a0a0] mb-8">
              Join healthcare professionals using our platform to better serve their patients.
            </p>
            <Link
              href="/signin"
              className="inline-block px-8 py-3 bg-[#c1a57d] text-white font-semibold rounded-lg hover:bg-[#a89267] transition"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] dark:border-[#2a2a2a] mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#c1a57d] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm text-[#666666] dark:text-[#a0a0a0]">
                HealthJournal Doctor Portal
              </span>
            </div>
            <p className="text-sm text-[#666666] dark:text-[#a0a0a0]">
              © 2025 HealthJournal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

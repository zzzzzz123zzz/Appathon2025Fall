'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthFormProps {
  onSuccess: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'doctors', userCredential.user.uid), {
          email,
          name,
          patients: [],
          createdAt: new Date()
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const doctorDoc = await getDoc(doc(db, 'doctors', userCredential.user.uid));
        if (!doctorDoc.exists()) {
          throw new Error('Doctor account not found');
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4] dark:bg-[#1a1a1a] p-4">
      <div className="bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[#e5e5e5] dark:border-[#3a3a3a]">
        <h1 className="text-3xl font-bold text-[#444444] dark:text-[#e0e0e0] mb-2 text-center">
          Doctor Portal
        </h1>
        <p className="text-[#888888] dark:text-[#a0a0a0] text-center mb-8">
          Monitor your patients&apos; health journals
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-[#444444] dark:text-[#e0e0e0] mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. John Smith"
                required
                className="w-full px-4 py-3 border-2 border-[#e5e5e5] dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#444444] dark:text-[#e0e0e0] focus:border-[#c1a57d] focus:outline-none transition"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[#444444] dark:text-[#e0e0e0] mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.com"
              required
              className="w-full px-4 py-3 border-2 border-[#e5e5e5] dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#444444] dark:text-[#e0e0e0] focus:border-[#c1a57d] focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#444444] dark:text-[#e0e0e0] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-[#e5e5e5] dark:border-[#3a3a3a] rounded-lg bg-white dark:bg-[#1a1a1a] text-[#444444] dark:text-[#e0e0e0] focus:border-[#c1a57d] focus:outline-none transition"
            />
          </div>

          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c1a57d] hover:bg-[#a89267] text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <p className="text-center text-[#888888] dark:text-[#a0a0a0] text-sm mt-6">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="ml-2 text-[#c1a57d] font-semibold hover:text-[#a89267]"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

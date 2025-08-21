import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, ADMIN_EMAIL, ADMIN_PASSWORD } from '../services/firebase';
import { TicketIcon } from './icons';

const AuthGate: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthAction = async (action: 'signIn' | 'register' | 'bootstrap') => {
    setMessage('');
    setIsLoading(true);
    try {
      if (action === 'signIn') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else if (action === 'register') {
        if (password.length < 6) {
            throw new Error("Password must be at least 6 characters long.");
        }
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: email.split('@')[0] });
        setMessage('User registered successfully. You are now logged in.');
      } else if (action === 'bootstrap') {
        setMessage('Ensuring admin account exists...');
        try {
            await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
            setMessage('Admin user created. Signing in...');
        } catch(e: any) {
            if (e.code !== 'auth/email-already-in-use') {
                throw e; // rethrow other errors
            }
            setMessage('Admin user already exists. Signing in...');
        }
        await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        setMessage('Signed in as admin.');
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0B0F1A]">
      <div className="w-full max-w-sm rounded-xl bg-[#0F1626] border border-[#22304A] p-6 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-3 mb-2">
            <TicketIcon className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-100">Pushtrack</h1>
        </div>
        <p className="text-sm text-slate-400 mb-6">Sign in to access your dashboard.</p>
        
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="username"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#121A2B] border border-[#22304A] px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (6+ characters)"
            autoComplete="current-password"
            disabled={isLoading}
            className="w-full rounded-lg bg-[#121A2B] border border-[#22304A] px-4 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div className="mt-6 space-y-3">
            <div className="flex gap-3">
                 <button onClick={() => handleAuthAction('signIn')} disabled={isLoading} className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:bg-indigo-800 disabled:cursor-not-allowed">
                    {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
                <button onClick={() => handleAuthAction('register')} disabled={isLoading} className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 shadow-sm hover:bg-slate-600 transition-colors disabled:bg-slate-800 disabled:cursor-not-allowed">
                    {isLoading ? '...' : 'Register'}
                </button>
            </div>
            <button onClick={() => handleAuthAction('bootstrap')} disabled={isLoading} className="w-full rounded-lg bg-transparent border border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-300 shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50">
                {isLoading ? '...' : 'Ensure Admin (first time setup)'}
            </button>
        </div>

        {message && (
          <p className="mt-4 text-center text-xs text-amber-300 min-h-[1.5em]">{message}</p>
        )}
      </div>
    </div>
  );
};

export default AuthGate;

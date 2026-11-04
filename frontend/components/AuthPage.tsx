import React from 'react';
import { useParams } from 'react-router-dom';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

/** Neon Auth pages: /auth/sign-in, /auth/sign-up, /auth/forgot-password, etc. */
export const AuthPage: React.FC = () => {
  const { pathname } = useParams<{ pathname: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Yearly Expense Sheet</h1>
          <p className="text-xs text-slate-500 mt-1">Sign in to manage your monthly budgets</p>
        </div>
        <AuthView pathname={pathname || 'sign-in'} />
      </div>
    </div>
  );
};

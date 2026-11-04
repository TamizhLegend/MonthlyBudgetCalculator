import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { NeonAuthUIProvider } from '@neondatabase/neon-js/auth/react';
import { neon } from '../lib/neon';

interface NeonAuthProviderProps {
  children: React.ReactNode;
}

/** Neon Auth UI Link prop uses `href`; React Router uses `to`. */
const AuthLink: React.FC<{ href: string; className?: string; children: React.ReactNode }> = ({
  href,
  className,
  children,
}) => (
  <RouterLink to={href} className={className}>
    {children}
  </RouterLink>
);

/** Wires Neon Auth UI to React Router (must render inside BrowserRouter). */
export const NeonAuthProvider: React.FC<NeonAuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();

  return (
    <NeonAuthUIProvider
      emailOTP
      authClient={neon.auth}
      redirectTo="/"
      navigate={(href) => navigate(href)}
      replace={(href) => navigate(href, { replace: true })}
      Link={AuthLink}
    >
      {children}
    </NeonAuthUIProvider>
  );
};

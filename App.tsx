import React, { useState } from 'react';
import Auth from './components/Auth';
import PreferenceManager from './components/PreferenceManager';
import type { User } from './types';
import { Spinner } from './components/common/Spinner';

interface Session {
  user: User;
  sessionKey: CryptoKey;
}

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  // Set initial loading to false, as there's no session to restore from storage.
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = (user: User, sessionKey: CryptoKey) => {
    setSession({ user, sessionKey });
  };

  const handleLogout = () => {
    // Simply clear the session state to return to the login screen.
    // This avoids a full page reload which can cause issues in some environments.
    setSession(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
        <Spinner size="h-12 w-12" />
      </div>
    );
  }

  return (
    <>
      {session ? (
        <PreferenceManager user={session.user} sessionKey={session.sessionKey} onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
};

export default App;

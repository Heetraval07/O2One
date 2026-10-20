import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { admin, setSignedOutHandler } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/** Knows whether someone is signed in. `status` is 'loading' until the first check finishes. */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', email: '', mailEnabled: false });

  const signedOut = useCallback(() => setState((s) => ({ ...s, status: 'out', email: '' })), []);
  useEffect(() => setSignedOutHandler(signedOut), [signedOut]);

  useEffect(() => {
    let live = true;
    admin
      .me()
      .then((me) => live && setState({ status: 'in', email: me.email, mailEnabled: me.mailEnabled }))
      .catch(() => live && setState((s) => ({ ...s, status: 'out' })));
    return () => {
      live = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      async login(email, password) {
        const me = await admin.login(email, password);
        setState({ status: 'in', email: me.email, mailEnabled: me.mailEnabled });
      },
      async logout() {
        await admin.logout().catch(() => {});
        signedOut();
      },
      setEmail: (email) => setState((s) => ({ ...s, email })),
    }),
    [state, signedOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

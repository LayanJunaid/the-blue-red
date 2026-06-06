import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getStoredCustomer,
  loginCustomer,
  logoutCustomer,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    async function loadCustomer() {
      const storedCustomer = await getStoredCustomer();
      setCustomer(storedCustomer);
      setBooting(false);
    }

    loadCustomer();
  }, []);

  const login = async (customerId, password) => {
    const data = await loginCustomer(customerId, password);

    setCustomer({
      token: data.access_token,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
    });
  };

  const logout = async () => {
    await logoutCustomer();
    setCustomer(null);
  };

  const value = useMemo(
    () => ({
      customer,
      isAuthenticated: Boolean(customer),
      booting,
      login,
      logout,
    }),
    [customer, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
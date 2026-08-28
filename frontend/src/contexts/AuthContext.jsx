import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await API.get("/auth/me");
          setUser(res.data.data);
        } catch (error) {
          console.error("Session restoration failed", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await API.post("/auth/login", { email, password });
    const { token, data } = res.data;
    localStorage.setItem("token", token);
    setUser(data);
    return data;
  };

  const registerTenant = async (tenantData) => {
    const res = await API.post("/auth/register", tenantData);
    return res;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  const hasPermission = (requiredPermission) => {
    if (user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") return true;
    return permissions.includes(requiredPermission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        registerTenant,
        logout,
        isAuthenticated: !!user,
        role: user?.role,
        tenant: user?.tenant,
        permissions,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

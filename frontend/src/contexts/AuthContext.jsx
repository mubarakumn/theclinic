import { createContext, useContext, useState, useEffect } from "react";
import API from "../api";
import {
  configureOfflineIdentity,
  lockOfflineIdentity,
} from "../offline/outbox";

const AuthContext = createContext();

const saveOfflineUserSnapshot = (user) => {
  const tenant =
    user.tenant && typeof user.tenant === "object"
      ? {
          _id: user.tenant._id,
          name: user.tenant.name,
          code: user.tenant.code,
        }
      : user.tenant;

  localStorage.setItem(
    "user",
    JSON.stringify({
      _id: user._id,
      firstName: user.firstName,
      name: user.name,
      role: user.role,
      permissions: user.permissions || [],
      tenantId: user.tenantId,
      tenant,
    }),
  );
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState([]);
  const [offlineSession, setOfflineSession] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await API.get("/auth/me");
          setUser(res.data.data);
          setPermissions(res.data.data.permissions || []);
          saveOfflineUserSnapshot(res.data.data);
          try {
            await configureOfflineIdentity(res.data.data);
          } catch (offlineError) {
            console.error("Offline storage setup failed:", offlineError);
          }
        } catch (error) {
          console.error("Session restoration failed", error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
          } else if (!error.response) {
            const cachedUser = localStorage.getItem("user");
            if (cachedUser) {
              try {
                const restoredUser = JSON.parse(cachedUser);
                setUser(restoredUser);
                setPermissions(restoredUser.permissions || []);
                setOfflineSession(true);
                await configureOfflineIdentity(restoredUser);
              } catch (restoreError) {
                console.error("Offline session restoration failed", restoreError);
                setUser(null);
                setPermissions([]);
              }
            }
          }
          if (error.response || !localStorage.getItem("user")) {
            setUser(null);
            setPermissions([]);
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    const verifyOnlineSession = async () => {
      if (!offlineSession || !navigator.onLine) return;
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.data);
        setPermissions(res.data.data.permissions || []);
        localStorage.setItem("user", JSON.stringify(res.data.data));
        await configureOfflineIdentity(res.data.data);
        setOfflineSession(false);
      } catch (error) {
        console.error("Could not verify offline session after reconnect:", error);
      }
    };

    window.addEventListener("online", verifyOnlineSession);
    if (navigator.onLine) void verifyOnlineSession();
    return () => window.removeEventListener("online", verifyOnlineSession);
  }, [offlineSession]);

  const login = async (email, password, clinicCode) => {
    const res = await API.post("/auth/login", { email, password, clinicCode });
    const { token, data } = res.data;
    localStorage.setItem("token", token);
    saveOfflineUserSnapshot(data);
    setUser(data);
    setPermissions(data.permissions || []);
    setOfflineSession(false);
    try {
      await configureOfflineIdentity(data);
    } catch (error) {
      console.error("Offline storage setup failed:", error);
    }
    return data;
  };

  const acceptStaffInvitation = async (token, password) => {
    const res = await API.post("/auth/accept-invitation", { token, password });
    const { token: authToken, data } = res.data;
    localStorage.setItem("token", authToken);
    saveOfflineUserSnapshot(data);
    setUser(data);
    setPermissions(data.permissions || []);
    setOfflineSession(false);
    try {
      await configureOfflineIdentity(data);
    } catch (error) {
      console.error("Offline storage setup failed:", error);
    }
    return data;
  };

  const registerTenant = async (tenantData) => {
    const res = await API.post("/auth/register", tenantData);
    return res;
  };

  const logout = () => {
    lockOfflineIdentity();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPermissions([]);
    setOfflineSession(false);
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
        acceptStaffInvitation,
        registerTenant,
        logout,
        isAuthenticated: !!user,
        role: user?.role,
        tenant: user?.tenant,
        permissions,
        hasPermission,
        offlineSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Context hooks are intentionally exported alongside their provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

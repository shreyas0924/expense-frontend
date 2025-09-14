import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const SERVER_AUTH_URL = import.meta.env.VITE_APP_SERVER_AUTH_URL;

interface AuthContextType {
  isAuthenticated: boolean;
  accessToken: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refreshAuth: () => Promise<boolean>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Token management functions
  const getAccessToken = (): string | null => {
    return localStorage.getItem("accessToken");
  };

  const getRefreshToken = (): string | null => {
    return localStorage.getItem("refreshToken");
  };

  const setTokens = (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    setAccessToken(accessToken);
  };

  const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setAccessToken(null);
  };

  // Check if user is logged in by pinging the server
  const isLoggedIn = async (): Promise<boolean> => {
    const token = getAccessToken();
    
    if (!token) {
      return false;
    }

    try {
      const response = await axios.get(`${SERVER_AUTH_URL}/auth/v1/ping`, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      if (response.status === 200) {
        const responseBody = response.data;
        // Validate UUID response (assuming your ping returns a UUID)
        const isValidUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            responseBody.trim()
          );
        return isValidUUID;
      }
      return false;
    } catch (error) {
      console.error("Ping failed:", error);
      return false;
    }
  };

  // Refresh authentication token
  const refreshAuth = async (): Promise<boolean> => {
    try {
      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        console.log("No refresh token found");
        return false;
      }

      const response = await axios.post(
        `${SERVER_AUTH_URL}/auth/v1/refreshToken`,
        { token: refreshToken }, // Your backend expects { token: "..." }
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      console.log("Refresh response:", response.data); // Debug log

      if (response.status === 200 && response.data) {
        // Your backend returns: accessToken and token (same refresh token)
        const { accessToken, token } = response.data;
        
        if (accessToken && token) {
          setTokens(accessToken, token);
          setIsAuthenticated(true);
          return true;
        } else {
          console.error("Missing tokens in refresh response:", response.data);
        }
      }

      return false;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Token refresh failed:", {
          status: error.response?.status,
          data: error.response?.data,
        });
      } else {
        console.error("Token refresh failed:", error);
      }
      return false;
    }
  };

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = getAccessToken();
        const refreshToken = getRefreshToken();

        if (!token && !refreshToken) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        let authenticated = false;

        // If we have an access token, verify it
        if (token) {
          setAccessToken(token);
          authenticated = await isLoggedIn();
          
          // If token is invalid but we have refresh token, try refreshing
          if (!authenticated && refreshToken) {
            authenticated = await refreshAuth();
          }
        } 
        // If no access token but have refresh token, try refreshing
        else if (refreshToken) {
          authenticated = await refreshAuth();
        }

        setIsAuthenticated(authenticated);
        
        // Navigation logic
        const currentPath = window.location.pathname;
        if (authenticated && currentPath === '/login') {
          navigate("/dashboard");
        } else if (!authenticated && currentPath !== '/login' && currentPath !== '/signup') {
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        clearTokens();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, [navigate]);

  const login = (accessToken: string, refreshToken: string) => {
    setTokens(accessToken, refreshToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
    navigate("/login");
  };

  const contextValue: AuthContextType = {
    isAuthenticated,
    accessToken,
    login,
    logout,
    refreshAuth,
    loading,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
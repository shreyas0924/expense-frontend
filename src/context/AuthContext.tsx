import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import LoginService from "../services/login-service";
import axios from "axios";
import { SERVER_AUTH_URL } from "../utils/constants";

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
  const loginService = new LoginService();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = loginService.getAccessToken();
        setAccessToken(token);

        if (token) {
          const isLoggedIn = await loginService.isLoggedIn();
          setIsAuthenticated(isLoggedIn);

          if (!isLoggedIn) {
            // Try to refresh token if direct login check fails
            const refreshed = await refreshAuth();
            setIsAuthenticated(refreshed);
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (accessToken: string, refreshToken: string) => {
    loginService.setAccessToken(accessToken);
    loginService.setRefreshToken(refreshToken);
    setAccessToken(accessToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    loginService.clearTokens();
    setAccessToken(null);
    setIsAuthenticated(false);
  };

 const refreshAuth = async (): Promise<boolean> => {
  try {
    const refreshToken = loginService.getRefreshToken();

    if (!refreshToken) {
      return false;
    }

    const response = await axios.post(
      `${SERVER_AUTH_URL}/auth/v1/refreshToken`,
      {
        token: refreshToken,
      },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );

    if (response.status === 200) {
      const data = response.data;
      loginService.setAccessToken(data['accessToken']);
      loginService.setRefreshToken(data['token']);
      setAccessToken(data['accessToken']);

      console.log(
        'Tokens after refresh: refreshToken=' +
          data['token'] +
          ', accessToken=' +
          data['accessToken']
      );

      setIsAuthenticated(true);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Auth refresh failed:', error);
    logout();
    return false;
  }
};

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        accessToken,
        login,
        logout,
        refreshAuth,
        loading,
      }}
    >
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

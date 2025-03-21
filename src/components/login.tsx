import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginService from "../services/login-service";
import { SERVER_AUTH_URL } from "../utils/constants";

const Login: React.FC = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const loginService = new LoginService();

  const refreshToken = async (): Promise<boolean> => {
    console.log("Inside Refresh token");
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      return false;
    }

    try {
      const response = await axios.post(
        `${SERVER_AUTH_URL}/auth/v1/refreshToken`,
        {
          token: refreshToken,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;
        localStorage.setItem("accessToken", data["accessToken"]);
        localStorage.setItem("refreshToken", data["token"]);

        const newRefreshToken = localStorage.getItem("refreshToken");
        const accessToken = localStorage.getItem("accessToken");
        console.log(
          "Tokens after refresh are " + newRefreshToken + " " + accessToken
        );

        if (accessToken && newRefreshToken) {
          login(accessToken, newRefreshToken);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return false;
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${SERVER_AUTH_URL}/auth/v1/login`,
        {
          username: userName,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
            
          },
        }
      );

      if (response.status === 200) {
        const data = response.data;
        login(data["accessToken"], data["token"]);
        navigate("/dashboard");
      } else {
        setError("Invalid username or password");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const gotoSignup = () => {
    navigate("/signup");
  };

  useEffect(() => {
    const checkLoginStatus = async () => {
      setIsLoading(true);
      try {
        if (isAuthenticated) {
          navigate("/dashboard");
        } else {
          const isLoggedIn = await loginService.isLoggedIn();
          if (isLoggedIn) {
            navigate("/dashboard");
          } else {
            const refreshed = await refreshToken();
            if (refreshed) {
              navigate("/dashboard");
            }
          }
        }
      } catch (error) {
        console.error("Login check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Login</h1>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-100 rounded">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>

        <div className="text-center">
          <button
            onClick={gotoSignup}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

import axios from "axios";

class LoginService {
  private readonly SERVER_AUTH_URL = import.meta.env.VITE_APP_SERVER_AUTH_URL!;

  constructor() {}

  async isLoggedIn(): Promise<boolean> {
    console.log("Inside login");
    const accessToken = this.getAccessToken();
    console.log("Token is " + accessToken);

    if (!accessToken) {
      return false;
    }

    try {
      const response = await axios.get(`${this.SERVER_AUTH_URL}/auth/v1/ping`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: "Bearer " + accessToken,
          "X-Requested-With": "XMLHttpRequest",
        },

      });

      if (response.status !== 200) {
        return false;
      }

      const responseBody = response.data;
      console.log("Response body in isLoggedIn(): ", responseBody);
      const isValidUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          responseBody.trim()
        );
      return isValidUUID;
    } catch (error) {
      console.error("Error checking login status:", error);
      return false;
    }
  }

  // Store access token securely using localStorage
  setAccessToken(token: string): void {
    localStorage.setItem("accessToken", token);
  }

  // Get access token from storage
  getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  }

  // Store refresh token securely
  setRefreshToken(token: string): void {
    localStorage.setItem("refreshToken", token);
  }

  // Get refresh token from storage
  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  }

  // Clear all tokens (logout)
  clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

const loginServiceInstance = new LoginService();
export default loginServiceInstance;
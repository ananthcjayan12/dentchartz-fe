import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// For testing purposes - set this to true to use mock data
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

// Setup axios interceptor for token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;

        // Update the token in localStorage
        localStorage.setItem("token", access);

        // Update the authorization header
        axios.defaults.headers.common["Authorization"] = `Bearer ${access}`;
        originalRequest.headers["Authorization"] = `Bearer ${access}`;

        // Retry the original request
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: string;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  };
}

// Mock data for testing
const MOCK_USER = {
  id: "1",
  username: "testuser",
  email: "test@example.com",
  first_name: "Test",
  last_name: "User",
  role: "admin"
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (USE_MOCK_DATA) {
      // For testing - accept any credentials with non-empty username/password
      if (credentials.username && credentials.password) {
        return {
          access: "mock-access-token",
          refresh: "mock-refresh-token",
          user: MOCK_USER
        };
      } else {
        throw new Error("Invalid credentials");
      }
    }
    
    // Real implementation
    const response = await axios.post(`${API_URL}/auth/login/`, credentials);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<{ access: string }> {
    if (USE_MOCK_DATA) {
      return { access: "mock-refreshed-access-token" };
    }
    
    const response = await axios.post(`${API_URL}/auth/token/refresh/`, {
      refresh: refreshToken,
    });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    if (USE_MOCK_DATA) {
      return;
    }
    
    await axios.post(`${API_URL}/auth/logout/`, {
      refresh: refreshToken,
    });
  },

  async getCurrentUser(token: string): Promise<AuthResponse["user"]> {
    if (USE_MOCK_DATA) {
      return MOCK_USER;
    }
    
    const response = await axios.get(`${API_URL}/auth/me/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },
};

export default authService; 
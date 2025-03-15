"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authService, LoginCredentials, AuthResponse } from "@/services/auth.service";
import { toast } from "sonner";
import Cookies from "js-cookie";

// Define types for our context
type User = AuthResponse["user"];

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions for token management
const setTokens = (access: string, refresh: string) => {
  // Store in both localStorage (for persistence) and cookies (for middleware)
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
  
  // Set cookies with httpOnly for better security in production
  Cookies.set("accessToken", access, { 
    expires: 1, // 1 day
    sameSite: "strict",
    path: "/"
  });
  
  Cookies.set("refreshToken", refresh, { 
    expires: 7, // 7 days
    sameSite: "strict",
    path: "/"
  });
};

const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  Cookies.remove("accessToken");
  Cookies.remove("refreshToken");
};

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        
        if (!accessToken || !refreshToken) {
          setIsLoading(false);
          return;
        }
        
        try {
          // Validate token by getting current user
          const userData = await authService.getCurrentUser(accessToken);
          setUser(userData);
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            const { access } = await authService.refreshToken(refreshToken);
            localStorage.setItem("accessToken", access);
            Cookies.set("accessToken", access, { 
              expires: 1,
              sameSite: "strict",
              path: "/"
            });
            
            // Get user data with new token
            const userData = await authService.getCurrentUser(access);
            setUser(userData);
          } catch (refreshError) {
            // If refresh fails, clear tokens
            clearTokens();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const credentials: LoginCredentials = { username, password };
      const response = await authService.login(credentials);
      
      // Store tokens
      setTokens(response.access, response.refresh);
      
      // Set user
      setUser(response.user);
      
      // Redirect to dashboard
      router.push("/dashboard");
      
      toast.success("Login successful", {
        description: `Welcome back, ${response.user.first_name || response.user.username}!`,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message ||
                          "Failed to login. Please check your credentials.";
      setError(errorMessage);
      
      toast.error("Login failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear tokens and user data regardless of API response
      clearTokens();
      setUser(null);
      setIsLoading(false);
      
      // Redirect to login
      router.push("/login");
      
      toast.success("Logged out successfully");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 
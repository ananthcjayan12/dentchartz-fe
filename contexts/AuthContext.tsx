"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { authService, LoginCredentials, AuthResponse } from "@/services/auth.service";
import { toast } from "sonner";
import Cookies from "js-cookie";

// Define types for our context based on the actual API response
type User = {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
};

type Clinic = {
  id: number;
  name: string;
  role?: string;
  is_primary?: boolean;
  // Add other clinic fields as needed
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clinics: Clinic[];
  currentClinic: Clinic | null;
  setCurrentClinic: (clinic: Clinic) => void;
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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [currentClinic, setCurrentClinic] = useState<Clinic | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      
      if (token) {
        try {
          const authData = await authService.getCurrentUser(token);
          setUser(authData.user);
          setClinics(authData.clinics || []);
          setCurrentClinic(authData.current_clinic || null);
        } catch (error) {
          console.error("Auth check error:", error);
          clearTokens();
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const authData = await authService.login({ username, password });
      
      // Save tokens
      setTokens(authData.access, authData.refresh);
      
      // Set user data
      setUser(authData.user);
      setClinics(authData.clinics || []);
      setCurrentClinic(authData.current_clinic || null);
      
      // Redirect to dashboard
      router.push("/dashboard");
      
      toast.success("Login successful", {
        description: `Welcome back, ${authData.user.first_name || authData.user.username}!`,
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
      setClinics([]);
      setCurrentClinic(null);
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
        clinics,
        currentClinic,
        setCurrentClinic,
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
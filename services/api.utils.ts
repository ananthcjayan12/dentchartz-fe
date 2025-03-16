import { authService } from "./auth.service";

// Base API URL from environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Default headers for API requests
export const getDefaultHeaders = () => {
  const token = localStorage.getItem("accessToken"); // Use direct localStorage access for now
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Function to include clinic context in API requests
export const withClinicContext = async (url: string, options: RequestInit = {}) => {
  // Get current clinic from localStorage or another source
  const currentClinicId = localStorage.getItem("currentClinicId");
  
  // Add clinic_id as a query parameter if it exists
  const separator = url.includes("?") ? "&" : "?";
  const urlWithClinic = currentClinicId 
    ? `${url}${separator}clinic_id=${currentClinicId}` 
    : url;
  
  // Return the modified request
  return {
    url: urlWithClinic,
    options
  };
};

// Generic fetch function with clinic context
export const fetchWithClinic = async (
  url: string, 
  method: string = "GET", 
  data?: any, 
  customHeaders: Record<string, string> = {}
) => {
  const headers = {
    ...getDefaultHeaders(),
    ...customHeaders,
  };

  const options: RequestInit = {
    method,
    headers,
    ...(data ? { body: JSON.stringify(data) } : {}),
  };

  // Add clinic context to the request
  const { url: urlWithClinic, options: optionsWithClinic } = await withClinicContext(url, options);
  
  // Make the request
  const response = await fetch(`${API_BASE_URL}${urlWithClinic}`, optionsWithClinic);
  
  // Parse the response body
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const responseData = isJson ? await response.json() : await response.text();
  
  // Handle error responses
  if (!response.ok) {
    const error: any = new Error(
      typeof responseData === 'object' && responseData.detail
        ? responseData.detail
        : `API request failed with status ${response.status}`
    );
    
    error.status = response.status;
    error.response = { data: responseData };
    throw error;
  }
  
  return responseData;
};

// Convenience methods for different HTTP methods
export const apiGet = (url: string, customHeaders = {}) => 
  fetchWithClinic(url, "GET", undefined, customHeaders);

export const apiPost = (url: string, data: any, customHeaders = {}) => 
  fetchWithClinic(url, "POST", data, customHeaders);

export const apiPut = (url: string, data: any, customHeaders = {}) => 
  fetchWithClinic(url, "PUT", data, customHeaders);

export const apiPatch = (url: string, data: any, customHeaders = {}) => 
  fetchWithClinic(url, "PATCH", data, customHeaders);

// Modified fetchWithClinic specifically for DELETE requests
const fetchWithClinicDelete = async (
  url: string,
  data?: any,
  customHeaders: Record<string, string> = {}
) => {
  const headers = {
    ...getDefaultHeaders(),
    ...customHeaders,
  };

  const options: RequestInit = {
    method: "DELETE",
    headers,
    ...(data ? { body: JSON.stringify(data) } : {}),
  };

  // Add clinic context to the request
  const { url: urlWithClinic, options: optionsWithClinic } = await withClinicContext(url, options);
  
  // Make the request
  const response = await fetch(`${API_BASE_URL}${urlWithClinic}`, optionsWithClinic);
  
  // Handle response
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  // For DELETE requests, a 204 No Content response is common and valid
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return null; // Return null for empty responses
  }
  
  return response.json().catch(() => null); // Return null if JSON parsing fails
};

export const apiDelete = (url: string, data?: any, customHeaders = {}) => 
  fetchWithClinicDelete(url, data, customHeaders); 
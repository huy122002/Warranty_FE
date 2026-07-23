// src/services/axiosInstance.js
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api"; // ⚙️ Backend URL

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 🧠 Interceptor request — tự động thêm token cho mọi request
axiosInstance.interceptors.request.use(
  (config) => {
    // Ưu tiên lấy token theo role hiện tại, fallback về token chung
    const currentRole = localStorage.getItem("currentRole");
    let token = null;
    
    if (currentRole) {
      token = localStorage.getItem(`token_${currentRole}`);
    }
    
    // Fallback về token chung nếu không có token theo role
    if (!token) {
      token = localStorage.getItem("token") || 
              localStorage.getItem("accessToken") || 
              localStorage.getItem("access_token");
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Interceptor response — tự động xử lý lỗi
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorData = error.response?.data;

    // CHỈ đăng xuất khi status = 401 (Unauthorized) - chắc chắn là lỗi authentication
    // KHÔNG đăng xuất cho status 400 (Bad Request) - có thể là validation error, thiếu field, v.v.
    if (status === 401) {
      console.warn("⚠️ Unauthorized — Token expired or invalid", errorData);
      
      // Chỉ xóa session của role hiện tại
      const currentRole = localStorage.getItem("currentRole");
      if (currentRole) {
        localStorage.removeItem(`token_${currentRole}`);
        localStorage.removeItem(`user_${currentRole}`);
        localStorage.removeItem(`fullName_${currentRole}`);
        localStorage.removeItem(`userId_${currentRole}`);
        localStorage.removeItem(`technicianId_${currentRole}`);
      }
      
      // Xóa thông tin chung (backward compatibility)
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("fullName");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");
      localStorage.removeItem("technicianId");
      localStorage.removeItem("currentRole");
      localStorage.removeItem("currentUserId");
      
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

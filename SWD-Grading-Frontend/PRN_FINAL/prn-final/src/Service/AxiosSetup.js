import axios from "axios";

// Đảm bảo baseURL luôn có /api ở cuối
const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_BASE_URL;
  console.log("VITE_API_BASE_URL from env:", envURL);
  
  if (envURL) {
    // Nếu đã có /api ở cuối thì giữ nguyên, nếu không thì thêm vào
    const finalURL = envURL.endsWith('/api') ? envURL : `${envURL}/api`;
    console.log("Final baseURL:", finalURL);
    return finalURL;
  }
  // Default: localhost cho development
  const defaultURL = "http://localhost:5064/api";
  console.log("Using default baseURL:", defaultURL);
  return defaultURL;
};

const baseURL = getBaseURL();
const axiosInstance = axios.create({
  baseURL: baseURL,


  headers: {
    "Content-Type": "application/json",
  },
});

console.log("Axios instance created with baseURL:", axiosInstance.defaults.baseURL);

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Nếu là FormData, không set Content-Type để browser tự set với boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    // Thêm token vào header nếu có
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi 401 (Unauthorized) - token hết hạn hoặc không hợp lệ
    if (error.response && error.response.status === 401) {
      // Xóa token khỏi localStorage
      localStorage.removeItem("token");
      // Redirect về trang login nếu không phải đang ở trang login
      if (window.location.pathname !== "/" && window.location.pathname !== "/login") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;


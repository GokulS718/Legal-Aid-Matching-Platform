import axios from "axios";

// Centralized base API URL - use this for all API requests
export const API_BASE = "http://localhost:8080/api";

const axiosClient = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Preserve _silent flag for response interceptor
    if (config._silent !== undefined) {
        config._silent = config._silent;
    }
    return config;
});

axiosClient.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config;

        // Don't redirect for login endpoint - let the login form handle the error
        const isLoginEndpoint = original.url && original.url.includes('/auth/login');

        // Don't redirect for profile check requests (silent auth checks)
        const isProfileCheck = original.url && original.url.includes('/profile/me');

        // Don't redirect if this is a silent request (e.g., checking auth status)
        const isSilentRequest = original._silent === true || isProfileCheck;

        // Don't redirect if we're already on the login page
        const isOnLoginPage = window.location.pathname === '/login' || window.location.pathname === '/login/';

        // Don't redirect if we're on the home page (public route)
        const isOnHomePage = window.location.pathname === '/' || window.location.pathname === '';

        if (err.response && err.response.status === 401 && !original._retry && !isLoginEndpoint && !isOnLoginPage && !isSilentRequest && !isOnHomePage) {
            original._retry = true;
            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) {
                    localStorage.clear();
                    // Only redirect if not already on login or home page
                    if (!isOnLoginPage && !isOnHomePage) {
                        window.location.href = "/login";
                    }
                    return Promise.reject(err);
                }
                const resp = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
                const { accessToken, refreshToken: newRefresh } = resp.data;
                localStorage.setItem("accessToken", accessToken);
                if (newRefresh) localStorage.setItem("refreshToken", newRefresh);
                original.headers.Authorization = `Bearer ${accessToken}`;
                return axios(original);
            } catch (refreshErr) {
                localStorage.clear();
                // Only redirect if not already on login or home page
                if (!isOnLoginPage && !isOnHomePage) {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshErr);
            }
        }
        // For login endpoint errors, silent requests, or if already on login/home page, just reject without redirecting
        console.error("API Error:", {
            url: original.url,
            status: err.response?.status,
            message: err.message,
            data: err.response?.data
        });

        if (!err.response) {
            console.error("Network Error detected. Possible causes: Backend down, CORS issue, or browser blocking request.");
        }

        return Promise.reject(err);
    }
);

export default axiosClient;

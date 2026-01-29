import axiosClient from "./axiosClient.js";

export const login = (credentials) => axiosClient.post("/auth/login", credentials);

export const register = (payload) => axiosClient.post("/auth/register", payload);

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("email");
  localStorage.removeItem("username");
  localStorage.removeItem("role");
  localStorage.removeItem("userId");
};

export const getProfile = () => {
  // Mark as silent request to prevent redirects on 401 errors
  return axiosClient.get("/profile/me", {
    _silent: true
  });
};

export const updateProfile = (profileData, photoFile = null) => {
  const formData = new FormData();

  // Append all profile fields
  if (profileData.fullName) formData.append("fullName", profileData.fullName);
  if (profileData.aadhaar) formData.append("aadhaar", profileData.aadhaar);
  if (profileData.mobile) formData.append("mobile", profileData.mobile);
  if (profileData.dob) formData.append("dob", profileData.dob);
  if (profileData.state) formData.append("state", profileData.state);
  if (profileData.district) formData.append("district", profileData.district);
  if (profileData.city) formData.append("city", profileData.city);
  if (profileData.address) formData.append("address", profileData.address);

  // Append photo file if provided
  if (photoFile) {
    formData.append("profilePhoto", photoFile);
  }

  return axiosClient.put("/profile/me", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const forgotPassword = (data) => axiosClient.post("/auth/forgot-password", data);
export const verifyOtp = (data) => axiosClient.post("/auth/verify-otp", data);
export const resetPassword = (data) => axiosClient.post("/auth/reset-password", data);


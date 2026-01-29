import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../api/axiosClient.js";

// ---------------------------------------------
// ASYNC THUNKS
// ---------------------------------------------

// Login thunk
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosClient.post("/auth/login", credentials);

      if (response.data && response.data.token) {
        // Store token and essential data in localStorage
        localStorage.setItem("accessToken", response.data.token);
        localStorage.setItem("email", response.data.email || credentials.username);
        localStorage.setItem("username", response.data.username || "");
        localStorage.setItem("role", response.data.role || credentials.role);
        localStorage.setItem("userId", response.data.userId || "");

        // Extract userData from response
        const userData = response.data.userData || {};

        // Debug: Log the response to see what backend is sending
        console.log("Login Response:", response.data);
        console.log("UserData from backend:", userData);
        console.log("profilePhotoUrl in userData:", userData.profilePhotoUrl);
        console.log("profilePhotoUrl at top level:", response.data.profilePhotoUrl);

        // Get profilePhotoUrl from userData or top level of response
        const profilePhotoUrl = userData.profilePhotoUrl || response.data.profilePhotoUrl || null;
        console.log("Extracted profilePhotoUrl:", profilePhotoUrl);

        return {
          token: response.data.token,
          email: response.data.email || credentials.username,
          username: response.data.username || "",
          role: response.data.role || credentials.role,
          userId: response.data.userId || "",
          message: response.data.message || "Login successful!",
          // Include userData (profile) in the return value
          userData: {
            id: userData.id || null,
            fullName: userData.fullName || null,
            shortName: userData.fullName ? (userData.fullName.includes(" ")
              ? userData.fullName.split(" ")[0] + " " + userData.fullName.split(" ")[userData.fullName.split(" ").length - 1]
              : userData.fullName) : null,
            aadhaar: userData.aadharNum || null,
            email: userData.email || response.data.email || null,
            mobile: userData.mobileNum || null,
            dob: userData.dateOfBirth || null,
            state: userData.state || null,
            district: userData.district || null,
            city: userData.city || null,
            address: userData.address || null,
            photoUrl: profilePhotoUrl, // Use extracted profilePhotoUrl
            role: response.data.role || credentials.role,
          },
        };
      } else {
        return rejectWithValue("Invalid response from server");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Login failed"
      );
    }
  }
);

// Fetch user profile thunk
export const fetchUserProfile = createAsyncThunk(
  "auth/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const role = localStorage.getItem("role");
      if (role !== "CITIZEN" && role !== "ADMIN") {
        return rejectWithValue("Profile fetching not applicable for this role");
      }
      const response = await axiosClient.get("/profile/me");

      if (response.data) {
        return response.data;
      } else {
        return rejectWithValue("No profile data received");
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        "Failed to fetch profile"
      );
    }
  }
);

// Logout thunk
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      // Clear localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("email");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      localStorage.removeItem("userId");

      return true;
    } catch (error) {
      return rejectWithValue("Logout failed");
    }
  }
);

// ---------------------------------------------
// INITIAL STATE
// ---------------------------------------------
const initialState = {
  // User authentication data
  user: {
    token: localStorage.getItem("accessToken") || null,
    email: localStorage.getItem("email") || null,
    username: localStorage.getItem("username") || null,
    role: localStorage.getItem("role") || null,
    userId: localStorage.getItem("userId") || null,
  },

  // User profile data (fetched from backend)
  profile: {
    id: null,
    fullName: null,
    shortName: null,
    aadhaar: null,
    email: null,
    mobile: null,
    dob: null,
    state: null,
    district: null,
    city: null,
    address: null,
    photoUrl: null,
    role: null,
  },

  // Loading and error states
  isLoading: false,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  error: null,
};

// ---------------------------------------------
// SLICE
// ---------------------------------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Update profile data manually (for editing)
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },

    // Set user data (for manual updates)
    setUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
  },

  extraReducers: (builder) => {
    // LOGIN
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = {
          token: action.payload.token,
          email: action.payload.email,
          username: action.payload.username,
          role: action.payload.role,
          userId: action.payload.userId,
        };
        // Store profile data from login response
        if (action.payload.userData) {
          state.profile = {
            id: action.payload.userData.id || null,
            fullName: action.payload.userData.fullName || null,
            shortName: action.payload.userData.shortName || action.payload.userData.fullName || null,
            aadhaar: action.payload.userData.aadhaar || null,
            email: action.payload.userData.email || action.payload.email || null,
            mobile: action.payload.userData.mobile || null,
            dob: action.payload.userData.dob || null,
            state: action.payload.userData.state || null,
            district: action.payload.userData.district || null,
            city: action.payload.userData.city || null,
            address: action.payload.userData.address || null,
            photoUrl: action.payload.userData.photoUrl || null,
            role: action.payload.userData.role || action.payload.role || null,
          };
        }
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
        state.user = {
          token: null,
          email: null,
          username: null,
          role: null,
          userId: null,
        };
      });

    // FETCH USER PROFILE
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = {
          id: action.payload.id || null,
          fullName: action.payload.fullName || null,
          shortName: action.payload.shortName || action.payload.fullName || null,
          aadhaar: action.payload.aadhaar || null,
          email: action.payload.email || null,
          mobile: action.payload.mobile || null,
          dob: action.payload.dob || null,
          state: action.payload.state || null,
          district: action.payload.district || null,
          city: action.payload.city || null,
          address: action.payload.address || null,
          photoUrl: action.payload.photoUrl || null,
          role: action.payload.role || null,
        };
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // LOGOUT
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = {
          token: null,
          email: null,
          username: null,
          role: null,
          userId: null,
        };
        state.profile = {
          id: null,
          fullName: null,
          shortName: null,
          aadhaar: null,
          email: null,
          mobile: null,
          dob: null,
          state: null,
          district: null,
          city: null,
          address: null,
          photoUrl: null,
          role: null,
        };
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateProfile, setUser } = authSlice.actions;
export default authSlice.reducer;


import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import Login from "./components/Auth/Login.jsx";
import Register from "./components/Auth/Register.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";
import Services from "./Services.jsx";
import About from "./About.jsx";
import Contact from "./Contact.jsx";

import CitizenDashboard from "./components/Dashboard/CitizenDashboard.jsx";
import LawyerDashboard from "./components/lawyerDashboard/LawyerDashboard.jsx";
import NGODashboard from "./components/Dashboard/NGODashboard.jsx";
import AdminDashboard from "./components/adminDashbaord/AdminDashboard.jsx";

import ForgotPassword from "./components/Auth/ForgotPassword.jsx";
import VerifyOTP from "./components/Auth/VerifyOTP.jsx";
import ResetPassword from "./components/Auth/ResetPassword.jsx";

import MapComponent from "./pages/MapComponent.jsx";

import LawyerMyCases from "./pages/lawyer/LawyerMyCases";
import NgoMyCases from "./pages/ngo/NgoMyCases";

import { getProfile } from "./api/auth.js";

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        return;
      }

      try {
        const role = localStorage.getItem("role");
        if (role === "CITIZEN" || role === "ADMIN") {
          const res = await getProfile();
          if (res && res.data) {
            setUser(res.data);
          }
        } else {
          setUser({
            email: localStorage.getItem("email"),
            role: role,
            userId: localStorage.getItem("userId"),
          });
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
        }
        setUser(null);
      }
    };

    fetchProfile();
  }, []);

  const onLogin = (userData) => {
    setUser(userData);
    const role = userData.role?.toUpperCase();

    if (role === "CITIZEN") navigate("/citizen/dashboard");
    else if (role === "LAWYER") navigate("/lawyer/dashboard");
    else if (role === "NGO") navigate("/ngo/dashboard");
    else if (role === "ADMIN") navigate("/dashboard/admin");
    else navigate("/");
  };

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Home user={user} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register onRegister={onLogin} />} />

        {/* Info pages */}
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />

        {/* Password reset */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Map */}
        <Route path="/map" element={<MapComponent />} />

        {/* Dashboards */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/citizen/dashboard" element={<CitizenDashboard />} />
        <Route path="/lawyer/dashboard" element={<LawyerDashboard />} />
        <Route path="/ngo/dashboard" element={<NGODashboard />} />
        <Route path="/dashboard/admin" element={<AdminDashboard />} />

        {/* My Cases pages */}
        <Route path="/lawyer/mycases" element={<LawyerMyCases />} />
        <Route path="/ngo/mycases" element={<NgoMyCases />} />
      </Routes>
    </div>
  );
}

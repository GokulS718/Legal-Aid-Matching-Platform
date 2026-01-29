import React, { useState } from "react";
import { resetPassword } from "../../api/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const { state } = useLocation();
  const email = state?.email;
  const role = state?.role;

  const navigate = useNavigate();

  // Validation
  const validatePassword = (val) => {
    if (!val || val.trim() === "") return "Password is required";
    if (val.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  const validateConfirm = (val, pass) => {
    if (!val || val.trim() === "") return "Please confirm password";
    if (val !== pass) return "Passwords do not match";
    return "";
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === "password") {
      setValidationErrors((prev) => ({ ...prev, password: validatePassword(password) }));
      if (confirm) setValidationErrors((prev) => ({ ...prev, confirm: validateConfirm(confirm, password) }));
    }
    if (field === "confirm") {
      setValidationErrors((prev) => ({ ...prev, confirm: validateConfirm(confirm, password) }));
    }
  };

  const handleChange = (field, val) => {
    if (field === "password") setPassword(val);
    if (field === "confirm") setConfirm(val);

    if (touched[field]) {
      if (field === "password") {
        setValidationErrors((prev) => ({ ...prev, password: validatePassword(val) }));
        // Re-validate confirm if password changes
        if (touched.confirm) {
          setValidationErrors((prev) => ({ ...prev, confirm: validateConfirm(confirm, val) }));
        }
      }
      if (field === "confirm") {
        setValidationErrors((prev) => ({ ...prev, confirm: validateConfirm(val, password) }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const passErr = validatePassword(password);
    const confErr = validateConfirm(confirm, password);

    if (passErr || confErr) {
      setTouched({ password: true, confirm: true });
      setValidationErrors({ password: passErr, confirm: confErr });
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ email, role, newPassword: password });
      toast.success("Password reset successfully! Please login.");
      navigate("/login", { state: { success: "Password reset successfully!" } });
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Failed to reset password";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-white dark:bg-[#111111] px-4 py-12 relative overflow-hidden font-serif transition-colors duration-300">
      {/* Background Texture/Gradient */}
      <div className="absolute inset-0 z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37] rounded-full filter blur-[150px] opacity-10 animate-pulse"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#8B4513] rounded-full filter blur-[150px] opacity-10"></div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-0 min-h-[650px] shadow-2xl overflow-hidden z-10 relative border border-gray-100 dark:border-transparent transition-colors">
        {/* LEFT PANEL - IMAGE */}
        <div className="relative hidden md:block group overflow-hidden bg-black">
          <img
            src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop"
            alt="Business Executive"
            className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          <div className="absolute bottom-0 left-0 p-12 text-[#E5E5E5] z-10">
            <div className="w-20 h-20 mb-6 flex items-center justify-center border-2 border-[#D4AF37]/30 rounded-full bg-black/50 backdrop-blur-md">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain brightness-0 invert" />
            </div>
            <h2 className="text-5xl font-bold mb-4 tracking-tight font-serif text-[#D4AF37]">AdvoCare</h2>
            <p className="text-gray-300 text-lg font-light leading-relaxed max-w-md border-l-4 border-[#D4AF37] pl-4">
              Secure your future today.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="w-full h-full flex flex-col justify-center p-10 md:p-16 bg-white dark:bg-[#1a1a1a] relative border-l border-gray-100 dark:border-[#333] transition-colors">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-4xl font-bold text-[#D4AF37] mb-2 font-serif">Reset Password</h2>
              <p className="text-gray-500 dark:text-gray-400 font-sans transition-colors">Create a strong new password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>

              {/* NEW PASSWORD */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide group-focus-within:text-[#D4AF37] transition-colors">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    className={`block w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-[#252525] border ${touched.password && validationErrors.password ? 'border-red-500 bg-red-50 dark:border-red-900 dark:bg-red-900/10' : 'border-gray-200 dark:border-[#333]'} text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-sans text-sm`}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#D4AF37] focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
                {touched.password && validationErrors.password && (
                  <p className="text-red-500 text-xs mt-1 font-sans">{validationErrors.password}</p>
                )}
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide group-focus-within:text-[#D4AF37] transition-colors">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => handleChange("confirm", e.target.value)}
                    onBlur={() => handleBlur("confirm")}
                    className={`block w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-[#252525] border ${touched.confirm && validationErrors.confirm ? 'border-red-500 bg-red-50 dark:border-red-900 dark:bg-red-900/10' : 'border-gray-200 dark:border-[#333]'} text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-sans text-sm`}
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#D4AF37] focus:outline-none cursor-pointer"
                  >
                    {showConfirm ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
                {touched.confirm && validationErrors.confirm && (
                  <p className="text-red-500 text-xs mt-1 font-sans">{validationErrors.confirm}</p>
                )}
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 flex items-start gap-3 transition-colors">
                  <span className="text-red-500 mt-0.5"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                  <div className="text-sm text-red-600 dark:text-red-400 font-sans transition-colors">{error}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-4 px-4 border border-transparent shadow-lg text-sm font-bold uppercase tracking-widest text-[#1a1a1a] bg-[#D4AF37] hover:bg-[#c5a059] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] font-sans ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loading ? "RESETTING..." : "RESET PASSWORD"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

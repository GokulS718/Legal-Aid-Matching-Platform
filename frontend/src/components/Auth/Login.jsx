import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../../Redux/authSlice.js";
import { toast } from "react-toastify";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import logo from "../../assets/logo.png";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  // Get auth state from Redux
  const { isLoading, error: authError, user, isAuthenticated } = useSelector((state) => state.auth);

  const successMsg = location.state?.success || null;

  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "CITIZEN",
  });

  const [error, setError] = useState(null);
  const loading = isLoading;
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const toastShownRef = useRef(false);

  useEffect(() => {
    if (successMsg && !toastShownRef.current) {
      toast.success(successMsg, { position: "top-right", autoClose: 3000 });
      toastShownRef.current = true;
      window.history.replaceState({}, document.title);
    }
  }, [successMsg]);

  // Validation
  const validateEmail = (email) => {
    if (!email || email.trim() === "") return "Email is required";
    return ""; // Simplified validation for flexibility
  };

  const validatePassword = (password) => {
    if (!password || password.trim() === "") return "Password is required";
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      let err = name === "username" ? validateEmail(value) : validatePassword(value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let err = field === "username" ? validateEmail(form.username) : validatePassword(form.password);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  useEffect(() => {
    if (isAuthenticated && user.role) {
      toast.success("Login successful!");
      setTimeout(() => {
        const userRole = user.role;
        const path = userRole === "CITIZEN" ? "/citizen/dashboard" :
          userRole === "LAWYER" ? "/lawyer/dashboard" :
            userRole === "NGO" ? "/ngo/dashboard" : "/dashboard/admin";
        navigate(path, { state: { success: `Welcome ${userRole}` } });
      }, 500);
    }
  }, [isAuthenticated, user.role, navigate]);

  useEffect(() => {
    if (authError) {
      toast.error(authError);
      setError(authError);
      dispatch(clearError());
    }
  }, [authError, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setErrors({});
    dispatch(clearError());

    const emailError = validateEmail(form.username);
    const passwordError = validatePassword(form.password);
    const newErrors = {};
    if (emailError) newErrors.username = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    setTouched({ username: true, password: true });

    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix validation errors");
      return;
    }

    await dispatch(loginUser({ username: form.username, password: form.password, role: form.role }));
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
            src="https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop"
            alt="Lady Justice"
            className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          <div className="absolute bottom-0 left-0 p-12 text-[#E5E5E5] z-10">
            <div className="w-20 h-20 mb-6 flex items-center justify-center border-2 border-[#D4AF37]/30 rounded-full bg-black/50 backdrop-blur-md">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain brightness-0 invert" />
            </div>
            <h2 className="text-5xl font-bold mb-4 tracking-tight font-serif text-[#D4AF37]">AdvoCare</h2>
            <p className="text-gray-300 text-lg font-light leading-relaxed max-w-md border-l-4 border-[#D4AF37] pl-4">
              "Justice delayed is justice denied." <br /> Connect with top verified legal experts instantly.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL - LOGIN FORM */}
        <div className="w-full h-full flex flex-col justify-center p-10 md:p-16 bg-white dark:bg-[#1a1a1a] relative border-l border-gray-100 dark:border-[#333] transition-colors">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-4xl font-bold text-[#D4AF37] mb-2 font-serif">Member Login</h2>
              <p className="text-gray-500 dark:text-gray-400 font-sans transition-colors">Access your legal dashboard securely.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>

              {/* ROLE SELECTOR */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D4AF37] mb-3 font-semibold">I am a</label>
                <div className="grid grid-cols-2 gap-3">
                  {['CITIZEN', 'LAWYER', 'NGO', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleChange({ target: { name: 'role', value: r } })}
                      className={`py-2.5 px-4 text-xs font-bold uppercase tracking-widest transition-all border ${form.role === r
                        ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                        : 'bg-gray-50 dark:bg-[#252525] text-gray-400 dark:text-gray-500 border-gray-200 dark:border-[#333] hover:border-[#D4AF37] hover:text-[#D4AF37]'}`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* EMAIL */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide group-focus-within:text-[#D4AF37] transition-colors">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    onBlur={() => handleBlur("username")}
                    className={`block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#252525] border ${touched.username && errors.username ? 'border-red-500 bg-red-50 dark:border-red-900 dark:bg-red-900/10' : 'border-gray-200 dark:border-[#333]'} text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-sans text-sm`}
                    placeholder="Enter your registered email"
                  />
                </div>
                {touched.username && errors.username && (
                  <p className="text-red-500 text-xs mt-1 font-sans">{errors.username}</p>
                )}
              </div>

              {/* PASSWORD */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide group-focus-within:text-[#D4AF37] transition-colors">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur("password")}
                    className={`block w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-[#252525] border ${touched.password && errors.password ? 'border-red-500 bg-red-50 dark:border-red-900 dark:bg-red-900/10' : 'border-gray-200 dark:border-[#333]'} text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-sans text-sm`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-[#D4AF37] focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="text-red-500 text-xs mt-1 font-sans">{errors.password}</p>
                )}
                <div className="flex justify-end mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-[#D4AF37] transition-colors font-sans"
                  >
                    Forgot Password?
                  </Link>
                </div>
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
                {loading ? "AUTHENTICATING..." : "LOGIN"}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-[#333] text-center font-sans transition-colors">
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                New to AdvoCare?{" "}
                <Link
                  to="/register"
                  className="font-bold text-[#D4AF37] hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Register Now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

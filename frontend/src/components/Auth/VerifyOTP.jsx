import React, { useState } from "react";
import { verifyOtp } from "../../api/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { FiCheckCircle } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { toast } from "react-toastify";

export default function VerifyOTP() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email;
  const role = state?.role;

  // Validation
  const validateOtp = (val) => {
    if (!val || val.trim() === "") return "OTP is required";
    return "";
  };

  const handleChange = (e) => {
    setOtp(e.target.value);
    if (touched.otp) {
      setValidationErrors({ otp: validateOtp(e.target.value) });
    }
  };

  const handleBlur = () => {
    setTouched({ otp: true });
    setValidationErrors({ otp: validateOtp(otp) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    const otpError = validateOtp(otp);
    if (otpError) {
      setTouched({ otp: true });
      setValidationErrors({ otp: otpError });
      return;
    }

    setLoading(true);

    try {
      await verifyOtp({ email, otp });
      toast.success("OTP Verified Successfully!");
      navigate("/reset-password", { state: { email, role } });
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Invalid OTP";
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
            src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop"
            alt="Signing Documents"
            className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          <div className="absolute bottom-0 left-0 p-12 text-[#E5E5E5] z-10">
            <div className="w-20 h-20 mb-6 flex items-center justify-center border-2 border-[#D4AF37]/30 rounded-full bg-black/50 backdrop-blur-md">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain brightness-0 invert" />
            </div>
            <h2 className="text-5xl font-bold mb-4 tracking-tight font-serif text-[#D4AF37]">AdvoCare</h2>
            <p className="text-gray-300 text-lg font-light leading-relaxed max-w-md border-l-4 border-[#D4AF37] pl-4">
              Secure verification process.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL - FORM */}
        <div className="w-full h-full flex flex-col justify-center p-10 md:p-16 bg-white dark:bg-[#1a1a1a] relative border-l border-gray-100 dark:border-[#333] transition-colors">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center md:text-left">
              <h2 className="text-4xl font-bold text-[#D4AF37] mb-2 font-serif">Verify OTP</h2>
              <p className="text-gray-500 dark:text-gray-400 font-sans transition-colors">
                Enter the code sent to <strong>{email || "your email"}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>

              {/* OTP INPUT */}
              <div className="group">
                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 mb-2 uppercase tracking-wide group-focus-within:text-[#D4AF37] transition-colors">One-Time Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiCheckCircle className="h-5 w-5 text-gray-400 dark:text-gray-500 group-focus-within:text-[#D4AF37] transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={otp}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`block w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-[#252525] border ${touched.otp && validationErrors.otp ? 'border-red-500 bg-red-50 dark:border-red-900 dark:bg-red-900/10' : 'border-gray-200 dark:border-[#333]'} text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none focus:border-[#D4AF37] dark:focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all font-sans text-sm tracking-[0.5em] text-center`}
                    placeholder="— — — — — —"
                    maxLength={6}
                  />
                </div>
                {touched.otp && validationErrors.otp && (
                  <p className="text-red-500 text-xs mt-1 font-sans">{validationErrors.otp}</p>
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
                {loading ? "VERIFYING..." : "VERIFY OTP"}
              </button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-[#333] text-center font-sans transition-colors">
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                Didn't receive code?{" "}
                <button
                  onClick={() => navigate(-1)}
                  className="font-bold text-[#D4AF37] hover:text-gray-900 dark:hover:text-white transition-colors uppercase text-xs"
                >
                  Resend
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

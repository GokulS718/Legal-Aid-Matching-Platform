import React, { useState } from "react";
import CitizenForm from "./CitizenForm";
import LawyerForm from "./LawyerForm";
import NGOForm from "./NGOForm";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/logo.png";

const Register = () => {
  const [role, setRole] = useState("Citizen");
  const navigate = useNavigate();

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
  };

  const renderForm = () => {
    switch (role) {
      case "Citizen":
        return <CitizenForm />;
      case "Lawyer":
        return <LawyerForm />;
      case "NGO":
        return <NGOForm />;
      default:
        return <CitizenForm />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] flex relative overflow-hidden font-sans transition-colors duration-300">
      {/* Global Style Overrides for Child Forms */}
      <style>{`
        #dark-register-wrapper label {
            color: #6b7280; /* gray-500 */
            text-transform: uppercase;
            font-size: 0.75rem; /* xs */
            font-weight: 700;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
            transition: color 0.3s;
        }
        .dark #dark-register-wrapper label {
            color: #9ca3af !important; /* gray-400 */
        }
        #dark-register-wrapper input, 
        #dark-register-wrapper select, 
        #dark-register-wrapper textarea {
            background-color: #f9fafb !important; /* gray-50 */
            border-color: #e5e7eb !important; /* gray-200 */
            color: #111827 !important; /* gray-900 */
            border-radius: 0.5rem !important;
            padding: 1rem !important;
            transition: all 0.3s;
        }
        .dark #dark-register-wrapper input, 
        .dark #dark-register-wrapper select, 
        .dark #dark-register-wrapper textarea {
            background-color: #252525 !important;
            border-color: #333 !important;
            color: white !important;
            border-radius: 0 !important;
        }
        #dark-register-wrapper input:focus, 
        #dark-register-wrapper select:focus, 
        #dark-register-wrapper textarea:focus {
            border-color: #D4AF37 !important;
            box-shadow: 0 0 0 1px #D4AF37 !important;
            outline: none !important;
        }
        #dark-register-wrapper button[type="submit"] {
            background-color: #D4AF37 !important;
            color: #111 !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            letter-spacing: 0.1em !important;
            border-radius: 0.5rem !important;
            transition: all 0.3s ease !important;
        }
        .dark #dark-register-wrapper button[type="submit"] {
            border-radius: 0 !important;
        }
        #dark-register-wrapper button[type="submit"]:hover {
            background-color: #c5a059 !important;
            transform: translateY(-2px);
        }
        #dark-register-wrapper span.text-red-500 {
            color: #ef4444 !important;
        }
         /* File Input Text Color Fix */
        #dark-register-wrapper input[type="file"] {
            color: #6b7280;
        }
        .dark #dark-register-wrapper input[type="file"] {
            color: #9ca3af !important;
        }
      `}</style>

      {/* LEFT PANEL - IMAGE (Fixed) */}
      <div className="hidden lg:block w-1/2 relative bg-black">
        <img
          src="https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2072&auto=format&fit=crop"
          alt="Legal Scales"
          className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-16 z-10">
          <Link to="/" className="flex items-center gap-4 mb-8 group">
            <div className="w-16 h-16 bg-[#D4AF37]/20 border border-[#D4AF37] rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-[#D4AF37] transition-all">
              <img src={logo} alt="Logo" className="w-8 h-8 object-contain brightness-0 invert group-hover:invert-0 transition-all" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white font-serif tracking-tight">AdvoCare</h1>
              <p className="text-[#D4AF37] text-sm uppercase tracking-widest">Premium Legal Services</p>
            </div>
          </Link>
          <h2 className="text-5xl font-bold text-white mb-6 font-serif leading-tight">
            Join the Network of <br /> <span className="text-[#D4AF37]">Truth & Justice.</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed border-l-4 border-[#D4AF37] pl-6">
            Whether you seek justice or provide it, your journey starts here.
            Create a verified account to access premium legal support.
          </p>
        </div>
      </div>

      {/* RIGHT PANEL - FORM (Scrollable) */}
      <div className="w-full lg:w-1/2 h-full absolute right-0 top-0 overflow-y-auto bg-white dark:bg-[#111111] custom-scrollbar transition-colors">
        <div className="min-h-screen py-16 px-8 md:px-24 flex flex-col justify-center">

          {/* Mobile Logo for small screens */}
          <div className="lg:hidden text-center mb-10">
            <img src={logo} alt="Logo" className="w-16 h-16 mx-auto mb-4 brightness-0 invert" />
            <h1 className="text-3xl font-bold text-[#D4AF37] font-serif">AdvoCare</h1>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white font-serif mb-2 transition-colors">Create Account</h2>
            <p className="text-gray-500 dark:text-gray-400 transition-colors">Please select your role to proceed.</p>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-3 gap-4 mb-10 p-1 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-[#333] rounded-lg transition-colors">
            {['Citizen', 'Lawyer', 'NGO'].map((r) => (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={`py-3 text-sm font-bold uppercase tracking-widest transition-all rounded-md ${role === r
                  ? 'bg-[#D4AF37] text-black shadow-lg'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#252525]'
                  }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* The Form Rendered Here */}
          <div id="dark-register-wrapper">
            {renderForm()}
          </div>

          <div className="mt-10 pt-10 border-t border-gray-100 dark:border-[#333] text-center transition-colors">
            <p className="text-gray-400 dark:text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-[#D4AF37] font-bold hover:underline">
                Log In Here
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;

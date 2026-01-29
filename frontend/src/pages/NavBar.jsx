import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";

export default function Navbar({ user }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${isScrolled || !isHomePage
          ? "bg-black/90 backdrop-blur-md border-b border-[#333] py-2"
          : "bg-transparent py-4"
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* LEFT: LOGO + TITLE */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 flex items-center justify-center border border-[#D4AF37] rounded-full group-hover:bg-[#D4AF37] transition-all">
            <img
              src={logo}
              alt="Logo"
              className="w-6 h-6 object-contain brightness-0 invert group-hover:invert-0 transition-all"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-serif text-white group-hover:text-[#D4AF37] transition-colors">
            AdvoCare
          </h1>
        </Link>

        {/* RIGHT: LINKS + BUTTONS */}
        <div className="flex items-center space-x-10">
          <div className="hidden md:flex space-x-8 text-sm font-bold uppercase tracking-widest">
            <Link
              to="/"
              className="text-gray-300 hover:text-[#D4AF37] transition-colors"
            >
              Home
            </Link>
            <Link
              to="/about"
              className="text-gray-300 hover:text-[#D4AF37] transition-colors"
            >
              About
            </Link>
            <Link
              to="/services"
              className="text-gray-300 hover:text-[#D4AF37] transition-colors"
            >
              Services
            </Link>
            <Link
              to="/contact"
              className="text-gray-300 hover:text-[#D4AF37] transition-colors"
            >
              Contact
            </Link>
          </div>

          {!user && (
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="px-6 py-2 border border-[#D4AF37] text-[#D4AF37] text-xs font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-2 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-widest hover:bg-[#c5a059] transition-all"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

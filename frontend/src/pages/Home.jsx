import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../Redux/authSlice.js";
import React from "react";
import Navbar from "../pages/NavBar";
import logo from "../assets/logo.png";
import { FiArrowRight } from "react-icons/fi";

export default function Home({ user }) {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("role");
    if (token && isAuthenticated && role) {
      dispatch(logoutUser());
    }
  }, [dispatch, isAuthenticated]);

  const sliderImages = [
    {
      image: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2072&auto=format&fit=crop",
      title: "Justice Should Never Be A Privilege",
      message: "Every voice matters. Every citizen deserves equal access to justice, support, and legal awareness.",
    },
    {
      image: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop",
      title: "Empowering Communities, One Case at a Time",
      message: "When citizens, lawyers and NGOs unite, justice becomes a reality — not a distant dream.",
    },
    {
      image: "https://images.unsplash.com/photo-1479142506502-19b3a3b7ff33?q=80&w=2070&auto=format&fit=crop",
      title: "Your Rights Matter. Your Story Matters.",
      message: "No one should fight alone. Together, we stand for fairness, dignity, and human rights.",
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [ecosystemTypingText, setEcosystemTypingText] = useState("");
  const [ecosystemMessageIndex, setEcosystemMessageIndex] = useState(0);
  const [ecosystemIsDeleting, setEcosystemIsDeleting] = useState(false);

  const typingMessages = [
    "Justice Is Everyone's Right.",
    "Legal Aid For Every Citizen.",
    "Connecting Communities Through Law.",
    "Empowering Voices, Ensuring Rights.",
    "Building Bridges To Justice."
  ];

  const ecosystemMessages = [
    "Our Ecosystem",
    "Citizens, Lawyers & NGOs",
    "United For Justice",
    "A Network Of Support",
    "Together We Stand"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [sliderImages.length]);

  useEffect(() => {
    const currentMessage = typingMessages[currentMessageIndex];
    let timeout;

    if (!isDeleting && typingText.length < currentMessage.length) {
      // Typing
      timeout = setTimeout(() => {
        setTypingText(currentMessage.substring(0, typingText.length + 1));
      }, 100);
    } else if (!isDeleting && typingText.length === currentMessage.length) {
      // Pause after typing complete
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting && typingText.length > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setTypingText(currentMessage.substring(0, typingText.length - 1));
      }, 50);
    } else if (isDeleting && typingText.length === 0) {
      // Move to next message
      setIsDeleting(false);
      setCurrentMessageIndex((prev) => (prev + 1) % typingMessages.length);
    }

    return () => clearTimeout(timeout);
  }, [typingText, currentMessageIndex, isDeleting, typingMessages]);

  useEffect(() => {
    const currentMessage = ecosystemMessages[ecosystemMessageIndex];
    let timeout;

    if (!ecosystemIsDeleting && ecosystemTypingText.length < currentMessage.length) {
      // Typing
      timeout = setTimeout(() => {
        setEcosystemTypingText(currentMessage.substring(0, ecosystemTypingText.length + 1));
      }, 120);
    } else if (!ecosystemIsDeleting && ecosystemTypingText.length === currentMessage.length) {
      // Pause after typing complete
      timeout = setTimeout(() => {
        setEcosystemIsDeleting(true);
      }, 2500);
    } else if (ecosystemIsDeleting && ecosystemTypingText.length > 0) {
      // Deleting
      timeout = setTimeout(() => {
        setEcosystemTypingText(currentMessage.substring(0, ecosystemTypingText.length - 1));
      }, 60);
    } else if (ecosystemIsDeleting && ecosystemTypingText.length === 0) {
      // Move to next message
      setEcosystemIsDeleting(false);
      setEcosystemMessageIndex((prev) => (prev + 1) % ecosystemMessages.length);
    }

    return () => clearTimeout(timeout);
  }, [ecosystemTypingText, ecosystemMessageIndex, ecosystemIsDeleting, ecosystemMessages]);

  return (
    <div className="w-full bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-200 font-sans selection:bg-[#D4AF37] selection:text-black transition-colors duration-300">
      <Navbar />

      {/* 🌿 HERO SECTION */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div
          className="absolute inset-0 h-full w-full bg-cover bg-center transition-all duration-1000 transform scale-105"
          style={{
            backgroundImage: `url(${sliderImages[currentSlide].image})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 dark:via-black/50 to-white dark:to-[#111111]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 max-w-5xl mx-auto">
          <div className="w-24 h-1 bg-[#D4AF37] mb-8 animate-pulse"></div>
          <h1 className="text-5xl md:text-7xl font-bold text-[#D4AF37] drop-shadow-2xl leading-tight font-serif tracking-tight mb-6 animate-fadeIn">
            {sliderImages[currentSlide].title}
          </h1>

          <p className="text-xl md:text-2xl text-gray-100 dark:text-gray-300 max-w-3xl leading-relaxed drop-shadow-lg font-light mb-10">
            {sliderImages[currentSlide].message}
          </p>

          <div className="flex gap-6">
            <Link to="/register" className="px-8 py-4 bg-[#D4AF37] text-black font-bold uppercase tracking-widest hover:bg-[#c5a059] transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
              Get Started
            </Link>
            <Link to="/about" className="px-8 py-4 border border-[#D4AF37] text-[#D4AF37] font-bold uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all transform hover:-translate-y-1">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* 🌿 MISSION SECTION */}
      <section className="relative py-24 bg-white dark:bg-[#111111] transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-[#f0f0f0] mb-4 font-serif transition-colors min-h-[80px] md:min-h-[120px] flex items-center justify-center">
              <span>
                {typingText.replace(/\.$/, '')}
                {typingText.endsWith('.') && <span className="text-[#D4AF37]">.</span>}
              </span>
              <span className="text-[#D4AF37] animate-pulse ml-1">|</span>
            </h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto"></div>
          </div>

          <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-4xl mx-auto leading-relaxed mb-16 font-light transition-colors">
            Millions silently face injustice — wrongful arrests, domestic violence, and discrimination.
            Our mission is to bring <span className="text-[#D4AF37] font-medium">citizens, lawyers, and NGOs</span> together.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Wrongful Arrests", desc: "We help individuals who were unfairly detained connect with immediate legal support.", icon: "⚖️" },
              { title: "Domestic Violence", desc: "Survivors deserve protection. We connect them with NGOs and trusted legal experts.", icon: "💚" },
              { title: "Human Rights", desc: "From discrimination to violence — we support communities fighting for their dignity.", icon: "🛑" }
            ].map((item, idx) => (
              <div key={idx} className="group p-8 rounded-none border border-gray-100 dark:border-[#333] bg-gray-50 dark:bg-[#1a1a1a] hover:border-[#D4AF37] transition-all duration-300 hovered-card relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37] opacity-5 rounded-bl-full transition-all group-hover:scale-150"></div>
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-2xl font-bold text-[#D4AF37] mb-4 font-serif">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors leading-relaxed transition-colors">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🌿 ROLES SECTION */}
      <section className="py-24 bg-gray-50 dark:bg-[#0a0a0a] relative transition-colors">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-16 font-serif min-h-[60px] md:min-h-[80px] flex items-center justify-center">
            <span>{ecosystemTypingText}</span>
            <span className="text-[#D4AF37] animate-pulse">|</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Citizens */}
            <div className="relative group overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all z-10"></div>
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Citizen" />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full bg-gradient-to-t from-black to-transparent">
                <h3 className="text-3xl font-bold text-[#D4AF37] mb-2 font-serif">Citizens</h3>
                <p className="text-gray-300 mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  Get verified legal guidance and document assistance securely.
                </p>
                <Link to="/register" className="inline-flex items-center text-[#D4AF37] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                  Join as Citizen <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

            {/* Lawyers */}
            <div className="relative group overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all z-10"></div>
              <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop" className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="Lawyer" />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full bg-gradient-to-t from-black to-transparent">
                <h3 className="text-3xl font-bold text-[#D4AF37] mb-2 font-serif">Lawyers</h3>
                <p className="text-gray-300 mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  Take up pro-bono cases and empower the vulnerable.
                </p>
                <Link to="/register" className="inline-flex items-center text-[#D4AF37] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                  Join as Lawyer <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

            {/* NGOs */}
            <div className="relative group overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all z-10"></div>
              <img src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700" alt="NGO" />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full bg-gradient-to-t from-black to-transparent">
                <h3 className="text-3xl font-bold text-[#D4AF37] mb-2 font-serif">NGOs</h3>
                <p className="text-gray-300 mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  Verify cases and provide on-ground social support.
                </p>
                <Link to="/register" className="inline-flex items-center text-[#D4AF37] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                  Join as NGO <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 🌿 FOOTER */}
      <footer className="bg-gray-100 dark:bg-black text-gray-600 dark:text-gray-500 py-16 border-t border-gray-200 dark:border-[#222] transition-colors">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 flex items-center justify-center border border-[#D4AF37] rounded-full">
                <span className="text-xl">⚖️</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-serif transition-colors">AdvoCare</h2>
            </div>
            <p className="leading-relaxed text-sm transition-colors">
              We believe justice is a right, not a privilege. Our mission is to connect citizens, lawyers, and NGOs to make legal help accessible.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider transition-colors">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/">Home</Link></li>
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/about">About Us</Link></li>
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/services">Services</Link></li>
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider transition-colors">Get Help</h3>
            <ul className="space-y-3 text-sm">
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/register">Register</Link></li>
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/login">Login</Link></li>
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/faq">FAQ</Link></li>
              <li><Link className="hover:text-[#D4AF37] transition-colors" to="/support">Support</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider transition-colors">Connect</h3>
            <div className="flex space-x-4">
              {['Twitter', 'LinkedIn', 'Instagram'].map(social => (
                <a key={social} href="#" className="w-10 h-10 border border-gray-200 dark:border-[#333] flex items-center justify-center rounded-full hover:bg-[#D4AF37] hover:text-white dark:hover:text-black hover:border-[#D4AF37] transition-all transition-colors">
                  {social[0]}
                </a>
              ))}
            </div>
            <p className="mt-6 text-xs transition-colors">
              © {new Date().getFullYear()} AdvoCare.<br />All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

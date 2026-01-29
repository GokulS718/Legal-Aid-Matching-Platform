import React, { useState, useEffect, useRef } from "react";
import Navbar from "./pages/NavBar";

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-200 font-sans selection:bg-[#D4AF37] selection:text-black transition-colors duration-300">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative py-24 bg-white dark:bg-[#111111] transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-2 block">About Us</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-[#f0f0f0] mb-4 font-serif transition-colors">
              About LegalAid Connect
            </h1>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-4xl mx-auto leading-relaxed font-light transition-colors">
              Our mission is simple — to make justice accessible for every citizen,
              regardless of their background or financial capacity.
            </p>
          </div>

          {/* IMAGE BANNER */}
          <div className="mt-10 rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#333] transition-colors">
            <img
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=60"
              className="w-full h-72 object-cover"
              alt="justice"
            />
          </div>
        </div>
      </section>

      {/* VISION & MISSION SECTION */}
      <section className="relative py-24 bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-white dark:bg-[#1a1a1a] shadow-xl rounded-2xl border border-gray-200 dark:border-[#333] transition-colors hover:border-[#D4AF37]/50">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-4 font-serif">Our Vision</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed transition-colors">
                We envision a world where legal support is not a luxury but a
                right. Through pro bono lawyers, NGOs, and verified legal
                professionals, we aim to bridge the gap between those who need
                help and those who can offer it.
              </p>
            </div>

            <div className="p-8 bg-white dark:bg-[#1a1a1a] shadow-xl rounded-2xl border border-gray-200 dark:border-[#333] transition-colors hover:border-[#D4AF37]/50">
              <h2 className="text-2xl font-bold text-[#D4AF37] mb-4 font-serif">Why We Exist</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed transition-colors">
                Millions remain unheard because they lack legal awareness or
                cannot afford representation. We created this platform to empower
                citizens, support communities, and unite legal helpers for a
                stronger society.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section ref={statsRef} className="relative py-24 bg-white dark:bg-[#111111] transition-colors">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div 
              className={`bg-gray-50 dark:bg-[#1a1a1a] shadow-lg rounded-2xl p-8 border border-gray-200 dark:border-[#333] transition-all duration-700 hover:border-[#D4AF37]/50 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '0ms' }}
            >
              <h3 className="text-4xl font-bold text-[#D4AF37] mb-2 font-serif">500+</h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Cases Supported</p>
            </div>
            <div 
              className={`bg-gray-50 dark:bg-[#1a1a1a] shadow-lg rounded-2xl p-8 border border-gray-200 dark:border-[#333] transition-all duration-700 hover:border-[#D4AF37]/50 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '150ms' }}
            >
              <h3 className="text-4xl font-bold text-[#D4AF37] mb-2 font-serif">200+</h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Pro Bono Lawyers</p>
            </div>
            <div 
              className={`bg-gray-50 dark:bg-[#1a1a1a] shadow-lg rounded-2xl p-8 border border-gray-200 dark:border-[#333] transition-all duration-700 hover:border-[#D4AF37]/50 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              <h3 className="text-4xl font-bold text-[#D4AF37] mb-2 font-serif">100+</h3>
              <p className="text-gray-600 dark:text-gray-400 transition-colors">Partner NGOs</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import React from "react";
import Navbar from "./pages/NavBar";
import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";

export default function Services() {
  return (
    <div className="w-full bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-200 font-sans selection:bg-[#D4AF37] selection:text-black transition-colors duration-300">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative py-24 bg-white dark:bg-[#111111] transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-2 block">Our Services</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-[#f0f0f0] mb-4 font-serif transition-colors">
              Our Services
            </h1>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-4xl mx-auto leading-relaxed font-light transition-colors">
              We provide a wide range of legal and social justice services designed
              to support citizens, lawyers, and NGOs.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICE CARDS SECTION */}
      <section className="relative py-24 bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CITIZEN SERVICE */}
            <div className="relative group overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop" 
                className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                alt="Citizen Support" 
              />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full bg-gradient-to-t from-black to-transparent">
                <h3 className="text-3xl font-bold text-[#D4AF37] mb-2 font-serif">Citizen Support</h3>
                <p className="text-gray-300 mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  File your case, describe your issue, and get connected with trusted lawyers & NGOs.
                </p>
                <Link to="/register" className="inline-flex items-center text-[#D4AF37] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                  Get Support <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

            {/* LAWYER SERVICE */}
            <div className="relative group overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2664&auto=format&fit=crop" 
                className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                alt="Pro Bono Work" 
              />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full bg-gradient-to-t from-black to-transparent">
                <h3 className="text-3xl font-bold text-[#D4AF37] mb-2 font-serif">Pro Bono Work</h3>
                <p className="text-gray-300 mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  Lawyers can volunteer expertise and support those without access to legal aid.
                </p>
                <Link to="/register" className="inline-flex items-center text-[#D4AF37] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                  Join as Lawyer <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>

            {/* NGO SERVICE */}
            <div className="relative group overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-all z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" 
                className="w-full h-[500px] object-cover grayscale group-hover:grayscale-0 transition-all duration-700" 
                alt="NGO Collaboration" 
              />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full bg-gradient-to-t from-black to-transparent">
                <h3 className="text-3xl font-bold text-[#D4AF37] mb-2 font-serif">NGO Collaboration</h3>
                <p className="text-gray-300 mb-4 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  NGOs can collaborate on social justice issues and help communities in need.
                </p>
                <Link to="/register" className="inline-flex items-center text-[#D4AF37] font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
                  Register NGO <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAILED SERVICES SECTION */}
      <section className="relative py-24 bg-white dark:bg-[#111111] transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-[#f0f0f0] mb-4 font-serif transition-colors">
              How We Help <span className="text-[#D4AF37]">.</span>
            </h2>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-4xl mx-auto leading-relaxed font-light transition-colors">
              Our comprehensive platform connects those in need with verified legal professionals and support organizations.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {/* CITIZEN SUPPORT DETAILS */}
            <div className="group p-8 rounded-2xl border border-gray-100 dark:border-[#333] bg-gray-50 dark:bg-[#1a1a1a] hover:border-[#D4AF37] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37] opacity-5 rounded-bl-full transition-all group-hover:scale-150"></div>
              <div className="text-4xl mb-6">⚖️</div>
              <h3 className="text-2xl font-bold text-[#D4AF37] mb-4 font-serif">Citizen Support</h3>
              <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors leading-relaxed mb-4">
                File your case, describe your issue, and get connected with trusted lawyers & NGOs.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Case filing and documentation assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Verified lawyer matching based on specialization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>NGO support for social justice cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Secure messaging and consultation booking</span>
                </li>
              </ul>
            </div>

            {/* PRO BONO WORK DETAILS */}
            <div className="group p-8 rounded-2xl border border-gray-100 dark:border-[#333] bg-gray-50 dark:bg-[#1a1a1a] hover:border-[#D4AF37] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37] opacity-5 rounded-bl-full transition-all group-hover:scale-150"></div>
              <div className="text-4xl mb-6">👨‍⚖️</div>
              <h3 className="text-2xl font-bold text-[#D4AF37] mb-4 font-serif">Pro Bono Work</h3>
              <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors leading-relaxed mb-4">
                Lawyers can volunteer expertise and support those without access to legal aid.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Take on pro-bono cases from verified citizens</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Manage your availability and appointments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Build your professional profile and reputation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Connect with NGOs for collaborative cases</span>
                </li>
              </ul>
            </div>

            {/* NGO COLLABORATION DETAILS */}
            <div className="group p-8 rounded-2xl border border-gray-100 dark:border-[#333] bg-gray-50 dark:bg-[#1a1a1a] hover:border-[#D4AF37] transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#D4AF37] opacity-5 rounded-bl-full transition-all group-hover:scale-150"></div>
              <div className="text-4xl mb-6">🤝</div>
              <h3 className="text-2xl font-bold text-[#D4AF37] mb-4 font-serif">NGO Collaboration</h3>
              <p className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300 transition-colors leading-relaxed mb-4">
                NGOs can collaborate on social justice issues and help communities in need.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Verify and support citizen cases</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Partner with lawyers for legal support</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Provide on-ground social assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37] mt-1">•</span>
                  <span>Track and manage community impact</span>
                </li>
              </ul>
            </div>
          </div>

          {/* ADDITIONAL FEATURES */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] transition-colors">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-serif">Verified Network</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                All lawyers and NGOs on our platform are verified and approved by our admin team. 
                We ensure that every professional meets our quality standards and is committed 
                to providing genuine legal support.
              </p>
            </div>
            <div className="p-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] transition-colors">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-serif">Secure Communication</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                Our platform provides end-to-end encrypted messaging, secure document sharing, 
                and appointment scheduling. Your privacy and data security are our top priorities.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

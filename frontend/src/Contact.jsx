import React from "react";
import Navbar from "./pages/NavBar";
import { FiMail, FiPhone, FiMapPin, FiSend } from "react-icons/fi";

export default function Contact() {
  return (
    <div className="w-full bg-white dark:bg-[#111111] text-gray-900 dark:text-gray-200 font-sans selection:bg-[#D4AF37] selection:text-black transition-colors duration-300">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative py-24 bg-white dark:bg-[#111111] transition-colors">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-2 block">Get In Touch</span>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-[#f0f0f0] mb-4 font-serif transition-colors">
              Contact Us
            </h1>
            <div className="w-24 h-1 bg-[#D4AF37] mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 dark:text-gray-400 text-center max-w-4xl mx-auto leading-relaxed font-light transition-colors">
              We're here to support you. Reach out anytime.
            </p>
          </div>
        </div>
      </section>

      {/* CONTACT FORM + INFO SECTION */}
      <section className="relative py-24 bg-gray-50 dark:bg-[#0a0a0a] transition-colors">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* LEFT: Form */}
            <div className="bg-white dark:bg-[#1a1a1a] shadow-lg hover:shadow-xl p-8 rounded-2xl border border-gray-200 dark:border-[#333] transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-serif transition-colors">
                Send Us a Message
              </h2>

              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full p-3 border border-gray-200 dark:border-[#333] rounded-lg text-sm bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all duration-200"
                />

                <input
                  type="email"
                  placeholder="Your Email"
                  className="w-full p-3 border border-gray-200 dark:border-[#333] rounded-lg text-sm bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all duration-200"
                />

                <textarea
                  rows="4"
                  placeholder="Your Message"
                  className="w-full p-3 border border-gray-200 dark:border-[#333] rounded-lg text-sm bg-white dark:bg-[#111] text-gray-900 dark:text-white focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all duration-200 resize-none"
                ></textarea>

                <button className="w-full bg-[#D4AF37] text-black py-3 rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#c5a059] transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2">
                  <FiSend className="w-4 h-4" /> Send Message
                </button>
              </form>
            </div>

            {/* RIGHT: Info */}
            <div className="p-8 bg-white dark:bg-[#1a1a1a] shadow-lg hover:shadow-xl rounded-2xl border border-gray-200 dark:border-[#333] transition-all duration-300">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 font-serif transition-colors">
                Contact Information
              </h2>

              <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm leading-relaxed mb-8 transition-colors">
                For legal support and queries, feel free to connect with us.
              </p>

              <div className="mt-5 space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:border-[#D4AF37]/50 transition-all group">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg group-hover:bg-[#D4AF37] transition-colors">
                    <FiMail className="w-5 h-5 text-[#D4AF37] group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">Email</p>
                    <p className="text-gray-900 dark:text-white font-medium transition-colors">advocare503@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:border-[#D4AF37]/50 transition-all group">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg group-hover:bg-[#D4AF37] transition-colors">
                    <FiPhone className="w-5 h-5 text-[#D4AF37] group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-gray-900 dark:text-white font-medium transition-colors">+91 9975474400</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] hover:border-[#D4AF37]/50 transition-all group">
                  <div className="p-3 bg-[#D4AF37]/10 rounded-lg group-hover:bg-[#D4AF37] transition-colors">
                    <FiMapPin className="w-5 h-5 text-[#D4AF37] group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-1">Office</p>
                    <p className="text-gray-900 dark:text-white font-medium transition-colors">Pune, Maharashtra, India</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-[#333]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 transition-colors">
                  Follow Us
                </h3>
                <div className="flex gap-4">
                  {['Facebook', 'Twitter', 'Instagram', 'YouTube'].map((social, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 border border-gray-200 dark:border-[#333] rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-black transition-all cursor-pointer group"
                    >
                      <span className="text-xl group-hover:scale-110 transition-transform">
                        {social === 'Facebook' && '📘'}
                        {social === 'Twitter' && '🐦'}
                        {social === 'Instagram' && '📸'}
                        {social === 'YouTube' && '🎥'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

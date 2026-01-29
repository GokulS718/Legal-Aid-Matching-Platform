import React from "react";
import appLogo from "../../assets/logo.png";

export default function Overview({ role, profile }) {
    const getRoleContent = () => {
        switch (role) {
            case "LAWYER":
                return {
                    bannerTitle: "Empowering Legal Excellence",
                    bannerText: "Your expertise provides a voice for those in need. Manage your cases and connect with citizens efficiently.",
                    roleTitle: "Your Role as a Lawyer",
                    roleText: "As a registered lawyer, you provide critical legal aid. Your commitment to justice helps bridge the gap for citizens seeking affordable and reliable legal representation.",
                    rights: ["Access to detailed case information", "Secure communication channels", "Efficient appointment management", "Professional profile visibility"],
                    responsibilities: ["Provide diligent legal representation", "Maintain client confidentiality", "Keep status updates current", "Uphold professional ethics"]
                };
            case "NGO":
                return {
                    bannerTitle: "Driving Social Impact",
                    bannerText: "Your organization is a pillar of support. Track your outreach and support cases to maximize your community impact.",
                    roleTitle: "Your Role as an NGO",
                    roleText: "As an NGO, you provide holistic support beyond just legal advice. You help citizens navigate complex social and legal challenges with empathy and resources.",
                    rights: ["Collaborate on multidisciplinary cases", "Access resource directories", "Direct communication with citizens", "Impact tracking and reporting"],
                    responsibilities: ["Verify citizen needs objectively", "Provide timely support services", "Coordinate with legal experts", "Protect vulnerable beneficiaries"]
                };
            default: // CITIZEN
                return {
                    bannerTitle: "A Safer Way to Begin Your Legal Journey",
                    bannerText: "From understanding your rights to finding the right lawyer, we’re here to support you at every step.",
                    roleTitle: "Your Role as a Citizen",
                    roleText: "As a citizen, you have the right to seek legal guidance, raise concerns, and access justice without fear or confusion. This platform empowers you to connect with verified legal professionals.",
                    rights: ["Right to legal representation", "Right to confidentiality & privacy", "Right to track your legal cases", "Right to fair communication"],
                    responsibilities: ["Provide accurate case information", "Respect legal procedures", "Communicate honestly", "Use platform ethically"]
                };
        }
    };

    const content = getRoleContent();

    return (
        <div className="space-y-10 font-sans transition-colors duration-300">
            {/* Banner Section */}
            <div className="relative bg-white dark:bg-[#1a1a1a] rounded-2xl p-10 text-gray-900 dark:text-white shadow-2xl border border-gray-200 dark:border-[#333] overflow-hidden group transition-colors">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <img src={appLogo} alt="logo" className="w-64 brightness-0 dark:invert transition-all" />
                </div>
                <div className="relative z-10">
                    <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block">Official Dashboard</span>
                    <h2 className="text-4xl font-bold font-serif mb-4 tracking-tight text-gray-900 dark:text-white transition-colors">{content.bannerTitle}</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl leading-relaxed transition-colors">{content.bannerText}</p>
                </div>
                {/* Decorative gold line */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
            </div>

            {/* Info Grid */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-[#333] relative transition-colors">
                <div className="mb-10">
                    <h3 className="text-2xl font-bold font-serif text-gray-900 dark:text-white mb-4 flex items-center gap-3 transition-colors">
                        <span className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center text-[#D4AF37] text-sm italic">i</span>
                        {content.roleTitle}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-4xl transition-colors">{content.roleText}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Rights Card */}
                    <div className="p-6 rounded-xl bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] hover:border-[#D4AF37]/50 transition-all duration-300 group shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-[10px] transition-colors">Your Core Rights</h4>
                        </div>
                        <ul className="space-y-4">
                            {content.rights.map((r, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5"></span>
                                    <span className="text-gray-600 dark:text-gray-400 text-sm leading-tight transition-colors">{r}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Responsibilities Card */}
                    <div className="p-6 rounded-xl bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#333] hover:border-[#D4AF37]/50 transition-all duration-300 group shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37] group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-widest text-[10px] transition-colors">Your Obligations</h4>
                        </div>
                        <ul className="space-y-4">
                            {content.responsibilities.map((r, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5"></span>
                                    <span className="text-gray-600 dark:text-gray-400 text-sm leading-tight transition-colors">{r}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

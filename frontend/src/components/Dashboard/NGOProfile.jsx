import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import {
    FiUsers, FiEdit3, FiCheck, FiMail, FiPhone, FiMapPin, FiAward, FiHash,
    FiHome, FiShield, FiX, FiNavigation, FiCalendar, FiGlobe
} from "react-icons/fi";

export default function NGOProfile({ profile, setProfile, isEditing, setIsEditing }) {
    const [formData, setFormData] = useState({ ...profile });
    const [isLoading, setIsLoading] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Fetch profile data from backend
    const fetchProfile = async () => {
        try {
            setIsFetching(true);
            // Get NGO ID from profile prop, localStorage userId, or from profile.id
            let ngoId = profile?.id;

            // If no ID in profile, try localStorage
            if (!ngoId) {
                const userId = localStorage.getItem("userId");
                if (userId) {
                    ngoId = parseInt(userId);
                }
            }

            if (ngoId) {
                console.log("Fetching NGO profile for ID:", ngoId);
                const response = await axiosClient.get(`/ngos/${ngoId}`);
                if (response.data) {
                    const profileData = response.data;
                    setProfile(profileData);
                    setFormData(profileData);
                    console.log("Profile fetched successfully:", profileData);
                    // toast.success("Profile loaded successfully!"); // Optional: Reduce noise
                }
            } else {
                console.warn("Could not determine NGO ID to fetch profile. Profile:", profile);
                // If we have some profile data, use it but show warning
                if (profile && Object.keys(profile).length > 0) {
                    setFormData({ ...profile });
                    toast.warning("Using cached profile data. Some fields may be missing.");
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            // If fetch fails but we have profile data, use it
            if (profile && Object.keys(profile).length > 0) {
                setFormData({ ...profile });
                toast.warning("Using cached profile data. Please refresh to get latest data.");
            } else {
                toast.error("Failed to load profile data. Please refresh the page.");
            }
        } finally {
            setIsFetching(false);
        }
    };

    // Fetch profile on mount
    useEffect(() => {
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync formData when profile changes
    useEffect(() => {
        if (profile && Object.keys(profile).length > 0) {
            setFormData({ ...profile });
        }
    }, [profile, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // For number fields if any
        if (e.target.type === 'number') {
            // Basic handling if we add number fields later
            setFormData((prev) => ({ ...prev, [name]: value }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleCancel = () => {
        setFormData({ ...profile }); // Reset to original profile
        setIsEditing(false);
        toast.info("Changes discarded.");
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setIsGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData((prev) => ({
                    ...prev,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                }));
                setIsGettingLocation(false);
                toast.success("Location captured successfully!");
            },
            (error) => {
                setIsGettingLocation(false);
                toast.error("Failed to get location: " + error.message);
            }
        );
    };

    const handleSave = async () => {
        try {
            setIsLoading(true);

            // Get NGO ID
            let ngoId = profile?.id || localStorage.getItem("userId");
            if (ngoId && typeof ngoId === 'string') {
                ngoId = parseInt(ngoId, 10);
            }

            if (!ngoId) {
                toast.error("Unable to determine NGO ID. Please refresh.");
                return;
            }

            // Prepare update payload
            const updatePayload = {
                ngoName: (formData.ngoName?.trim() || profile?.ngoName || ""),
                contact: (formData.contact?.trim() || profile?.contact || ""),
                ngoType: (formData.ngoType?.trim() || profile?.ngoType || ""),
                registrationNumber: (formData.registrationNumber?.trim() || profile?.registrationNumber || ""),
                address: (formData.address?.trim() || profile?.address || ""),
                city: (formData.city?.trim() || profile?.city || ""),
                state: (formData.state?.trim() || profile?.state || ""),
                district: (formData.district?.trim() || profile?.district || ""),
                pincode: (formData.pincode?.trim() || profile?.pincode || ""),
            };

            // Handle latitude and longitude
            if (formData.latitude) updatePayload.latitude = parseFloat(formData.latitude);
            if (formData.longitude) updatePayload.longitude = parseFloat(formData.longitude);

            const response = await axiosClient.put(`/ngos/${ngoId}`, updatePayload);

            setProfile(response.data);
            setFormData(response.data);
            setIsEditing(false);

            toast.success("✅ Profile updated successfully!", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            const msg = error.response?.data?.message || error.response?.data || "Failed to update profile";
            toast.error(`❌ ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 sm:p-12 shadow-2xl space-y-12 font-sans relative overflow-hidden transition-colors duration-300">
            {isFetching && (
                <div className="absolute inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 rounded-2xl">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
                        <p className="text-white font-bold">Loading profile data...</p>
                    </div>
                </div>
            )}

            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                <FiUsers size={120} className="text-[#D4AF37]" />
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 relative z-10">
                <div>
                    <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Organization Registry Archive</span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">NGO Profile Dossier</h2>
                </div>
                <div className="flex items-center gap-3">
                    {isEditing && (
                        <button
                            onClick={handleCancel}
                            disabled={isLoading}
                            className="px-6 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] disabled:opacity-50"
                        >
                            <FiX className="w-4 h-4" /> Cancel
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (isEditing) handleSave();
                            else setIsEditing(true);
                        }}
                        disabled={isLoading}
                        className={`px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl ${isEditing
                            ? "bg-[#D4AF37] text-black hover:bg-[#c5a059] shadow-[#D4AF37]/20"
                            : "bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
                            } disabled:opacity-50`}
                    >
                        {isLoading ? "Syncing..." : isEditing ? <><FiCheck className="w-4 h-4" /> Commit Changes</> : <><FiEdit3 className="w-4 h-4" /> Edit Dossier</>}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 border-t border-gray-100 dark:border-[#222] pt-10 transition-colors">
                {/* Basic Info */}
                <Input
                    label="NGO Official Designation"
                    name="ngoName"
                    value={formData.ngoName}
                    disabled={!isEditing}
                    icon={<FiUsers />}
                    onChange={handleChange}
                />

                <Input
                    label="Authorized Email (Read Only)"
                    name="email"
                    value={formData.email}
                    disabled={true}
                    icon={<FiMail />}
                    hint="Encrypted Primary Identifier"
                />

                <Input
                    label="Organization Contact"
                    name="contact"
                    value={formData.contact}
                    disabled={!isEditing}
                    icon={<FiPhone />}
                    onChange={handleChange}
                />

                <Input
                    label="Pillar / NGO Type"
                    name="ngoType"
                    value={formData.ngoType}
                    disabled={!isEditing}
                    icon={<FiAward />}
                    onChange={handleChange}
                />

                {/* Address Section */}
                <div className="md:col-span-2 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-[#333]">
                        Location & Address
                    </h3>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <Input
                        label="State"
                        name="state"
                        value={formData.state}
                        disabled={!isEditing}
                        icon={<FiMapPin />}
                        onChange={handleChange}
                    />
                    <Input
                        label="District"
                        name="district"
                        value={formData.district}
                        disabled={!isEditing}
                        icon={<FiMapPin />}
                        onChange={handleChange}
                    />
                    <Input
                        label="City"
                        name="city"
                        value={formData.city}
                        disabled={!isEditing}
                        icon={<FiMapPin />}
                        onChange={handleChange}
                    />
                    <Input
                        label="Pincode"
                        name="pincode"
                        value={formData.pincode}
                        disabled={!isEditing}
                        icon={<FiHash />}
                        onChange={handleChange}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-4">Registered Office Address</label>
                    <textarea
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows="4"
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-2xl px-6 py-5 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all resize-none disabled:opacity-50 disabled:grayscale placeholder-gray-400 dark:placeholder-gray-800 leading-relaxed transition-colors"
                        placeholder="Physical coordinate for legal and social correspondence..."
                    />
                </div>

                {/* Geographic Coordinates */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-[#333]">
                        Geographic Coordinates
                    </h3>
                </div>

                {isEditing && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <Input
                            label="Latitude"
                            name="latitude"
                            type="number"
                            step="any"
                            value={formData.latitude || ""}
                            disabled={false}
                            icon={<FiNavigation />}
                            onChange={handleChange}
                        />
                        <Input
                            label="Longitude"
                            name="longitude"
                            type="number"
                            step="any"
                            value={formData.longitude || ""}
                            disabled={false}
                            icon={<FiNavigation />}
                            onChange={handleChange}
                        />
                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={getCurrentLocation}
                                disabled={isGettingLocation}
                                className="w-full px-6 py-4 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <FiNavigation className="w-4 h-4" />
                                {isGettingLocation ? "Getting Location..." : "Get Current Location"}
                            </button>
                        </div>
                    </div>
                )}

                {!isEditing && (formData.latitude || formData.longitude) && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Latitude (Read Only)"
                            name="latitude"
                            value={formData.latitude || "Not Set"}
                            disabled={true}
                            icon={<FiNavigation />}
                        />
                        <Input
                            label="Longitude (Read Only)"
                            name="longitude"
                            value={formData.longitude || "Not Set"}
                            disabled={true}
                            icon={<FiNavigation />}
                        />
                    </div>
                )}

                <div className="md:col-span-2 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-[#333]">
                        Registration Details
                    </h3>
                </div>

                <div className="md:col-span-2">
                    <Input
                        label="Registration Number (Enrollment ID)"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        disabled={!isEditing}
                        icon={<FiShield />}
                        onChange={handleChange}
                    />
                </div>

                {/* Registration Date (Read Only) */}
                {!isEditing && formData.createdAt && (
                    <div className="md:col-span-2">
                        <Input
                            label="Registered On"
                            name="createdAt"
                            value={new Date(formData.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric"
                            })}
                            disabled={true}
                            icon={<FiCalendar />}
                        />
                    </div>
                )}
            </div>

            {/* Verification Badge Footer */}
            <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37]">
                        <FiHome size={24} />
                    </div>
                    <div>
                        <h4 className="text-gray-900 dark:text-white font-bold text-sm tracking-tight uppercase tracking-widest transition-colors">Verification Status</h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Cross-referenced with Charity Commissioner Records</p>
                    </div>
                </div>
                <div className="px-6 py-2 bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg transition-colors">
                    Authenticated Organization
                </div>
            </div>
        </div>
    );
}

/* UI HELPER */
const Input = ({ label, name, value, icon, disabled, type = "text", onChange, hint }) => (
    <div className="group">
        <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-3 group-focus-within:text-white transition-colors">{label}</label>
        <div className="relative">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]/50 group-focus-within:text-[#D4AF37] transition-colors">{icon}</div>
            <input
                type={type}
                name={name}
                value={value || ""}
                disabled={disabled}
                onChange={onChange}
                className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-xl pl-14 pr-6 py-4 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all disabled:opacity-50 disabled:grayscale transition-colors"
            />
        </div>
        {hint && <p className="mt-2 text-[9px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-widest transition-colors">{hint}</p>}
    </div>
);

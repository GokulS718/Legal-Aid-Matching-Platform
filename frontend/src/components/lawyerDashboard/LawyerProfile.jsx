import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { 
    FiUser, FiEdit3, FiSave, FiCheck, FiMail, FiPhone, FiMapPin, FiAward, FiShield, 
    FiX, FiFileText, FiCalendar, FiNavigation, FiGlobe 
} from "react-icons/fi";

export default function LawyerProfile({ profile, setProfile, isEditing, setIsEditing }) {
    const [formData, setFormData] = useState({ ...profile });
    const [isLoading, setIsLoading] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    // Fetch profile data from backend
    const fetchProfile = async () => {
        try {
            setIsFetching(true);
            // Get lawyer ID from profile prop, localStorage userId, or from profile.id
            let lawyerId = profile?.id;
            
            // If no ID in profile, try localStorage
            if (!lawyerId) {
                const userId = localStorage.getItem("userId");
                if (userId) {
                    lawyerId = parseInt(userId);
                }
            }

            // If still no ID, try to get from profile prop (might be string)
            if (!lawyerId && profile?.id) {
                lawyerId = typeof profile.id === 'string' ? parseInt(profile.id) : profile.id;
            }

            if (lawyerId) {
                console.log("Fetching lawyer profile for ID:", lawyerId);
                const response = await axiosClient.get(`/lawyers/${lawyerId}`);
                if (response.data) {
                    const profileData = response.data;
                    setProfile(profileData);
                    setFormData(profileData);
                    console.log("Profile fetched successfully:", profileData);
                    toast.success("Profile loaded successfully!", {
                        position: "top-right",
                        autoClose: 2000,
                        hideProgressBar: false,
                    });
                }
            } else {
                console.warn("Could not determine lawyer ID to fetch profile. Profile:", profile);
                // If we have some profile data, use it but show warning
                if (profile && Object.keys(profile).length > 0) {
                    setFormData({ ...profile });
                    toast.warning("Using cached profile data. Some fields may be missing.");
                } else {
                    toast.error("Unable to fetch profile. Please ensure you are logged in.");
                }
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            console.error("Error response:", error.response);
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

    // Sync formData when profile changes or when editing mode changes
    useEffect(() => {
        if (profile && Object.keys(profile).length > 0) {
            setFormData({ ...profile });
        }
    }, [profile, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // For number fields, convert empty string to 0 (not null), otherwise parse as integer
        if (e.target.type === 'number') {
            let numValue;
            if (value === '' || value === null || value === undefined) {
                numValue = 0; // Default to 0 instead of null
            } else {
                const parsed = parseFloat(value);
                numValue = isNaN(parsed) ? 0 : Math.max(0, Math.floor(parsed)); // Ensure non-negative integer
            }
            setFormData((prev) => ({ ...prev, [name]: numValue }));
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
            
            // Get lawyer ID first
            let lawyerId = profile?.id || localStorage.getItem("userId");
            if (lawyerId && typeof lawyerId === 'string') {
                lawyerId = parseInt(lawyerId, 10);
            }
            if (!lawyerId || isNaN(lawyerId)) {
                toast.error("Unable to determine lawyer ID. Please refresh the page.");
                setIsLoading(false);
                return;
            }

            // Prepare update payload with proper data types
            const updatePayload = {
                fullName: (formData.fullName?.trim() || profile?.fullName || ""),
                mobileNum: (formData.mobileNum?.trim() || profile?.mobileNum || ""),
                specialization: (formData.specialization?.trim() || profile?.specialization || ""),
                barState: (formData.barState?.trim() || profile?.barState || ""),
                barCouncilId: (formData.barCouncilId?.trim() || profile?.barCouncilId || ""),
                address: (formData.address?.trim() || profile?.address || ""),
                city: (formData.city?.trim() || profile?.city || ""),
                state: (formData.state?.trim() || profile?.state || ""),
                district: (formData.district?.trim() || profile?.district || ""),
            };

            // Handle experienceYears - ensure it's always a valid integer
            // Try multiple sources: formData.experienceYears, formData.experience, profile.experienceYears, profile.experience
            let experienceYears = formData.experienceYears ?? formData.experience ?? profile?.experienceYears ?? profile?.experience;
            
            // Convert to integer - handle all possible types
            if (experienceYears === undefined || experienceYears === null || experienceYears === "") {
                experienceYears = 0; // Default to 0 if nothing found
            } else if (typeof experienceYears === 'string') {
                const parsed = parseInt(experienceYears.trim(), 10);
                experienceYears = isNaN(parsed) ? 0 : parsed;
            } else if (typeof experienceYears === 'number') {
                experienceYears = isNaN(experienceYears) ? 0 : Math.floor(experienceYears);
            } else {
                experienceYears = 0; // Fallback
            }
            
            // Ensure it's a non-negative integer
            experienceYears = Math.max(0, Math.floor(experienceYears));
            updatePayload.experienceYears = experienceYears;
            
            console.log("Experience Years Processing:", {
                formData_experienceYears: formData.experienceYears,
                formData_experience: formData.experience,
                profile_experienceYears: profile?.experienceYears,
                profile_experience: profile?.experience,
                finalValue: updatePayload.experienceYears,
                finalType: typeof updatePayload.experienceYears
            });

            // Handle latitude and longitude - allow null
            if (formData.latitude !== undefined && formData.latitude !== null && formData.latitude !== "") {
                updatePayload.latitude = parseFloat(formData.latitude);
            } else if (profile?.latitude !== undefined && profile?.latitude !== null) {
                updatePayload.latitude = profile.latitude;
            }
            
            if (formData.longitude !== undefined && formData.longitude !== null && formData.longitude !== "") {
                updatePayload.longitude = parseFloat(formData.longitude);
            } else if (profile?.longitude !== undefined && profile?.longitude !== null) {
                updatePayload.longitude = profile.longitude;
            }

            // Validate ALL required fields
            const requiredFields = {
                fullName: updatePayload.fullName,
                mobileNum: updatePayload.mobileNum,
                specialization: updatePayload.specialization,
                barState: updatePayload.barState,
                barCouncilId: updatePayload.barCouncilId,
                address: updatePayload.address,
                city: updatePayload.city,
                state: updatePayload.state,
                district: updatePayload.district,
            };

            const missingFields = Object.entries(requiredFields)
                .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ""))
                .map(([key]) => key);

            if (missingFields.length > 0) {
                toast.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
                setIsLoading(false);
                return;
            }

            // ABSOLUTE FINAL CHECK - ensure experienceYears is always a valid integer
            if (updatePayload.experienceYears === null || 
                updatePayload.experienceYears === undefined || 
                typeof updatePayload.experienceYears !== 'number' || 
                isNaN(updatePayload.experienceYears)) {
                console.warn("CRITICAL: experienceYears is invalid, forcing to 0", updatePayload.experienceYears);
                updatePayload.experienceYears = 0;
            }
            
            // Ensure it's an integer (not float)
            updatePayload.experienceYears = Math.floor(Math.max(0, updatePayload.experienceYears));

            console.log("Final Update Payload:", {
                lawyerId,
                payload: JSON.parse(JSON.stringify(updatePayload)), // Deep clone for logging
                experienceYearsType: typeof updatePayload.experienceYears,
                experienceYearsValue: updatePayload.experienceYears,
                payloadString: JSON.stringify(updatePayload)
            });
            
            const response = await axiosClient.put(`/lawyers/${lawyerId}`, updatePayload);
            
            if (!response || !response.data) {
                throw new Error("Invalid response from server");
            }
            
            const updatedProfile = response.data;
            setProfile(updatedProfile);
            setFormData(updatedProfile);
            setIsEditing(false);
            
            toast.success("✅ Profile updated successfully!", {
                position: "top-right",
                autoClose: 3000,
            });
        } catch (error) {
            console.error("Error updating profile:", error);
            
            let errorMessage = "Failed to update profile";
            if (error.response?.status === 404) {
                errorMessage = "Lawyer profile not found. Please refresh the page.";
            } else if (error.response?.status === 400) {
                const serverMessage = error.response?.data;
                errorMessage = typeof serverMessage === 'string' 
                    ? serverMessage 
                    : (serverMessage?.message || "Invalid data. Please check your inputs.");
            } else if (error.response?.status === 401 || error.response?.status === 403) {
                errorMessage = "You don't have permission to update this profile.";
            } else if (error.response?.status === 500) {
                const serverError = error.response?.data;
                errorMessage = typeof serverError === 'string' 
                    ? `Server error: ${serverError}` 
                    : (serverError?.message || "Server error occurred. Please try again.");
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            toast.error(`❌ ${errorMessage}`, {
                position: "top-right",
                autoClose: 6000,
            });
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
                <FiAward size={120} className="text-[#D4AF37]" />
            </div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 relative z-10">
                <div>
                    <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Lawyer Registry Archive</span>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Professional Dossier</h2>
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
                        {isLoading ? "Syncing..." : isEditing ? <><FiCheck className="w-4 h-4" /> Commit Changes</> : <><FiEdit3 className="w-4 h-4" /> Edit Authority</>}
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10 border-t border-gray-100 dark:border-[#222] pt-10 transition-colors">
                {/* Personal Information Section */}
                <div className="md:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-[#333]">
                        Personal Information
                    </h3>
                </div>

                <Input
                    label="Official Full Name"
                    name="fullName"
                    value={formData.fullName}
                    disabled={!isEditing}
                    icon={<FiUser />}
                    onChange={handleChange}
                    required
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
                    label="Aadhar Number (Read Only)"
                    name="aadharNum"
                    value={formData.aadharNum || "N/A"}
                    disabled={true}
                    icon={<FiFileText />}
                    hint="Identity Verification Number"
                />

                <Input
                    label="Validated Contact"
                    name="mobileNum"
                    value={formData.mobileNum}
                    disabled={!isEditing}
                    icon={<FiPhone />}
                    onChange={handleChange}
                    required
                />

                {/* Professional Information Section */}
                <div className="md:col-span-2 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-[#333]">
                        Professional Credentials
                    </h3>
                </div>

                <Input
                    label="Bar Council ID"
                    name="barCouncilId"
                    value={formData.barCouncilId}
                    disabled={!isEditing}
                    icon={<FiShield />}
                    onChange={handleChange}
                />

                <Input
                    label="Bar Council State"
                    name="barState"
                    value={formData.barState}
                    disabled={!isEditing}
                    icon={<FiGlobe />}
                    onChange={handleChange}
                />

                <Input
                    label="Expertise / Specialization"
                    name="specialization"
                    value={formData.specialization}
                    disabled={!isEditing}
                    icon={<FiAward />}
                    onChange={handleChange}
                    required
                />

                <Input
                    label="Experience (Years)"
                    name="experienceYears"
                    type="number"
                    min="0"
                    value={(() => {
                        // Try formData.experienceYears first, then formData.experience, then profile.experienceYears, then profile.experience, default to 0
                        const val = formData.experienceYears ?? formData.experience ?? profile?.experienceYears ?? profile?.experience ?? 0;
                        return val !== null && val !== undefined ? val : 0;
                    })()}
                    disabled={!isEditing}
                    icon={<FiCalendar />}
                    onChange={handleChange}
                />

                {/* Location Information Section */}
                <div className="md:col-span-2 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-[#333]">
                        Location & Address
                    </h3>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Input
                        label="Jurisdiction: State"
                        name="state"
                        value={formData.state}
                        disabled={!isEditing}
                        icon={<FiMapPin />}
                        onChange={handleChange}
                    />
                    <Input
                        label="Administrative: District"
                        name="district"
                        value={formData.district}
                        disabled={!isEditing}
                        icon={<FiMapPin />}
                        onChange={handleChange}
                    />
                    <Input
                        label="Urban Hub (City)"
                        name="city"
                        value={formData.city}
                        disabled={!isEditing}
                        icon={<FiMapPin />}
                        onChange={handleChange}
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-4">Official Chambers / Address</label>
                    <textarea
                        name="address"
                        value={formData.address || ""}
                        onChange={handleChange}
                        disabled={!isEditing}
                        rows="4"
                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-2xl px-6 py-5 text-gray-900 dark:text-white text-sm font-medium focus:border-[#D4AF37] outline-none transition-all resize-none disabled:opacity-50 disabled:grayscale placeholder-gray-400 dark:placeholder-gray-800 leading-relaxed transition-colors"
                        placeholder="Detailed office location for client correspondence..."
                    />
                </div>

                {/* Geographic Coordinates */}
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

                {!isEditing && (formData.latitude && formData.longitude) && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Input
                            label="Latitude (Read Only)"
                            name="latitude"
                            value={formData.latitude}
                            disabled={true}
                            icon={<FiNavigation />}
                        />
                        <Input
                            label="Longitude (Read Only)"
                            name="longitude"
                            value={formData.longitude}
                            disabled={true}
                            icon={<FiNavigation />}
                        />
                    </div>
                )}

                {/* Registration Metadata (Read Only) */}
                {!isEditing && (
                    <>
                        <div className="md:col-span-2 mt-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-[#333]">
                                Registration Information
                            </h3>
                        </div>
                        {formData.createdAt && (
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
                        )}
                    </>
                )}
            </div>

            {/* Verification Badge Footer */}
            <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center text-[#D4AF37]">
                        <FiShield size={24} />
                    </div>
                    <div>
                        <h4 className="text-gray-900 dark:text-white font-bold text-sm tracking-tight uppercase tracking-widest transition-colors">Verification Status</h4>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest transition-colors">Cross-referenced with Bar Council Records</p>
                    </div>
                </div>
                <div className="px-6 py-2 bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg transition-colors">
                    Authenticated Provider
                </div>
            </div>
        </div>
    );
}

/* UI HELPER */
const Input = ({ label, name, value, icon, disabled, type = "text", onChange, hint, required = false }) => (
    <div className="group">
        <label className="block text-[10px] font-black text-[#D4AF37] uppercase tracking-[0.2em] mb-3 group-focus-within:text-white transition-colors">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
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

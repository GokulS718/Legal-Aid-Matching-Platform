import React, { useState, useEffect, useMemo, useRef } from "react";
import { getMatches } from "../../api/caseApi";
import { FiUser, FiMessageSquare, FiMapPin, FiAward, FiStar, FiArrowLeft, FiShield, FiInfo, FiX, FiMail, FiPhone, FiMap, FiGrid, FiNavigation, FiCrosshair } from "react-icons/fi";
import { createSession } from "../../api/chatApi";
import { toast } from "sonner";
import { useTheme } from "../../context/ThemeContext.jsx";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icons
const userIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const lawyerIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const ngoIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
}

// Component to fit map bounds
function FitBounds({ bounds }) {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds]);
    return null;
}

// Component to fetch and display route
function RoutingLine({ userLocation, destination, color }) {
    const [route, setRoute] = useState([]);

    useEffect(() => {
        if (!userLocation || !destination || !destination.latitude || !destination.longitude) {
            setRoute([]);
            return;
        }

        // Fetch route from OSRM
        const fetchRoute = async () => {
            try {
                const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;
                const response = await fetch(url);
                const data = await response.json();
                
                if (data.routes && data.routes[0]) {
                    const coordinates = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                    setRoute(coordinates);
                }
            } catch (error) {
                console.error("Error fetching route:", error);
                // Fallback to straight line
                setRoute([[userLocation.lat, userLocation.lng], [destination.latitude, destination.longitude]]);
            }
        };

        fetchRoute();
    }, [userLocation, destination]);

    if (route.length === 0) return null;

    return <Polyline positions={route} color={color} weight={4} opacity={0.7} />;
}

export default function CitizenMatches({ caseId, caseDetail, setActivePage, setSelectedRecipient, onBookAppointment, onBack, appointments = [], citizenProfile }) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [matches, setMatches] = useState({ lawyers: [], ngos: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("lawyers");
    const [viewingDetail, setViewingDetail] = useState(null);
    const [viewMode, setViewMode] = useState("cards"); // "cards" or "map"
    
    // User's current location from browser
    const [userLocation, setUserLocation] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationError, setLocationError] = useState(null);
    
    // Selected provider for routing
    const [selectedLawyerForRoute, setSelectedLawyerForRoute] = useState(null);
    const [selectedNgoForRoute, setSelectedNgoForRoute] = useState(null);

    // Get user's current location
    const getCurrentLocation = () => {
        setLocationLoading(true);
        setLocationError(null);
        
        if (!navigator.geolocation) {
            setLocationError("Geolocation is not supported by your browser");
            setLocationLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationLoading(false);
                toast.success("Location detected successfully!");
            },
            (error) => {
                let errorMessage = "Unable to retrieve your location";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Location permission denied. Please enable location access.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Location information is unavailable.";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Location request timed out.";
                        break;
                }
                setLocationError(errorMessage);
                setLocationLoading(false);
                toast.error(errorMessage);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // Auto-detect location when map view is selected
    useEffect(() => {
        if (viewMode === "map" && !userLocation) {
            getCurrentLocation();
        }
    }, [viewMode]);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await getMatches(caseId);
                const data = res.data;
                // Normalize name field
                if (data.lawyers) data.lawyers = data.lawyers.map(l => ({ ...l, name: l.fullName }));
                if (data.ngos) data.ngos = data.ngos.map(n => ({ ...n, name: n.ngoName }));
                setMatches(data);
            } catch (err) {
                console.error("Error fetching matches:", err);
            } finally {
                setLoading(false);
            }
        };
        if (caseId) fetchMatches();
    }, [caseId]);

    const handleStartChat = async (provider, role) => {
        try {
            const res = await createSession(caseId, provider.id, role.toUpperCase());
            const session = res.data;

            if (session && session.id) {
                setSelectedRecipient({
                    type: role.toLowerCase(),
                    id: provider.id,
                    name: provider.name || provider.fullName || provider.ngoName || "Provider",
                    sessionId: session.id
                });
                setActivePage("messages");
            } else {
                toast.error("Failed to create chat session.");
            }
        } catch (err) {
            console.error("Error starting chat:", err);
            const errorMsg = err.response?.data?.message || err.message || "Failed to start chat session.";
            toast.error(errorMsg);
        }
    };

    // Calculate distances and sort by nearest
    const lawyersWithDistance = useMemo(() => {
        return (matches.lawyers || []).map(l => ({
            ...l,
            distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, l.latitude, l.longitude) : null
        })).sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
    }, [matches.lawyers, userLocation]);

    const ngosWithDistance = useMemo(() => {
        return (matches.ngos || []).map(n => ({
            ...n,
            distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, n.latitude, n.longitude) : null
        })).sort((a, b) => {
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance;
        });
    }, [matches.ngos, userLocation]);

    // Get map bounds for lawyers
    const lawyerMapBounds = useMemo(() => {
        const points = [];
        if (userLocation) {
            points.push([userLocation.lat, userLocation.lng]);
        }
        lawyersWithDistance.forEach(item => {
            if (item.latitude && item.longitude) {
                points.push([item.latitude, item.longitude]);
            }
        });
        return points.length > 0 ? points : [[20.5937, 78.9629]];
    }, [lawyersWithDistance, userLocation]);

    // Get map bounds for NGOs
    const ngoMapBounds = useMemo(() => {
        const points = [];
        if (userLocation) {
            points.push([userLocation.lat, userLocation.lng]);
        }
        ngosWithDistance.forEach(item => {
            if (item.latitude && item.longitude) {
                points.push([item.latitude, item.longitude]);
            }
        });
        return points.length > 0 ? points : [[20.5937, 78.9629]];
    }, [ngosWithDistance, userLocation]);

    if (loading) {
        return (
            <div className="p-20 text-center flex flex-col items-center justify-center bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] transition-colors">
                <div className="w-12 h-12 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin mb-6"></div>
                <p className="text-[10px] font-bold text-gray-600 dark:text-gray-500 uppercase tracking-[0.3em] transition-colors">Querying Verified Network...</p>
            </div>
        );
    }

    const lawyers = lawyersWithDistance;
    const ngos = ngosWithDistance;

    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-[#333] p-10 shadow-2xl relative font-sans transition-colors duration-300">
            <button
                onClick={onBack}
                className="text-[10px] font-bold text-[#D4AF37] hover:text-gray-900 dark:hover:text-white uppercase tracking-widest mb-8 flex items-center gap-2 transition-colors group"
            >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> Back to Case Repository
            </button>
            <div className="mb-10">
                <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-2 block">Algorithmic Matching</span>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight transition-colors">Verified Legal Providers</h2>
                <p className="text-gray-600 dark:text-gray-500 text-sm mt-2 max-w-xl transition-colors">The following professionals have been matched based on your case classification, location, and specialization requirements.</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex gap-10 border-b border-gray-200 dark:border-[#333] transition-colors flex-1 min-w-[200px]">
                    <button
                        onClick={() => setActiveTab("lawyers")}
                        className={`pb-4 px-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "lawyers"
                            ? "text-[#D4AF37]"
                            : "text-gray-600 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-400"
                            }`}
                    >
                        Lawyers ({lawyers.length})
                        {activeTab === "lawyers" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab("ngos")}
                        className={`pb-4 px-2 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === "ngos"
                            ? "text-[#D4AF37]"
                            : "text-gray-600 dark:text-gray-600 hover:text-gray-900 dark:hover:text-gray-400"
                            }`}
                    >
                        NGOs ({ngos.length})
                        {activeTab === "ngos" && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.5)]"></div>}
                    </button>
                </div>

                {/* Toggle Cards / Map */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#222] rounded-xl p-1 transition-colors">
                    <button
                        onClick={() => setViewMode("cards")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === "cards"
                            ? "bg-[#D4AF37] text-black shadow-md"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                    >
                        <FiGrid className="w-4 h-4" /> Cards
                    </button>
                    <button
                        onClick={() => setViewMode("map")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === "map"
                            ? "bg-[#D4AF37] text-black shadow-md"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                            }`}
                    >
                        <FiMap className="w-4 h-4" /> Map
                    </button>
                </div>
            </div>

            {/* Map View */}
            {viewMode === "map" && (
                <div className="space-y-8">
                    {/* Location Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#333] transition-colors">
                        <div className="flex items-center gap-3">
                            <FiCrosshair className={`w-5 h-5 ${userLocation ? 'text-green-500' : 'text-gray-400'}`} />
                            <div>
                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    {locationLoading ? "Detecting location..." : 
                                     userLocation ? "Your Current Location" : 
                                     locationError || "Location not detected"}
                                </p>
                                {userLocation && (
                                    <p className="text-xs text-gray-500">
                                        {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={getCurrentLocation}
                            disabled={locationLoading}
                            className="px-4 py-2 bg-[#D4AF37] text-black text-xs font-bold rounded-lg hover:bg-[#c5a059] transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <FiCrosshair className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
                            {locationLoading ? "Detecting..." : "Refresh Location"}
                        </button>
                    </div>

                    {/* LAWYERS MAP */}
                    <div className="bg-gray-50 dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#333] p-6 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                                Lawyers Map
                                <span className="text-sm font-normal text-gray-500">({lawyers.length} matched)</span>
                            </h3>
                            {selectedLawyerForRoute && (
                                <button
                                    onClick={() => setSelectedLawyerForRoute(null)}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                                >
                                    Clear Route
                                </button>
                            )}
                        </div>

                        <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] mb-4">
                            <MapContainer
                                center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
                                zoom={10}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <FitBounds bounds={lawyerMapBounds} />

                                {/* User Marker */}
                                {userLocation && (
                                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-bold text-blue-600">📍 Your Location</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Lawyer Markers */}
                                {lawyers.map((lawyer) => (
                                    lawyer.latitude && lawyer.longitude && (
                                        <Marker
                                            key={lawyer.id}
                                            position={[lawyer.latitude, lawyer.longitude]}
                                            icon={lawyerIcon}
                                            eventHandlers={{
                                                click: () => setSelectedLawyerForRoute(lawyer)
                                            }}
                                        >
                                            <Popup>
                                                <div className="min-w-[220px]">
                                                    <p className="font-bold text-gray-900">{lawyer.name}</p>
                                                    <p className="text-sm text-green-600 font-semibold">{lawyer.specialization}</p>
                                                    <p className="text-sm text-gray-600">{lawyer.city}, {lawyer.state}</p>
                                                    {lawyer.distance && (
                                                        <p className="text-sm font-bold text-blue-600 mt-1">
                                                            📍 {lawyer.distance.toFixed(1)} km away
                                                        </p>
                                                    )}
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => setSelectedLawyerForRoute(lawyer)}
                                                            className="flex-1 bg-green-500 text-white text-xs px-2 py-1.5 rounded font-bold hover:bg-green-600"
                                                        >
                                                            Show Route
                                                        </button>
                                                        <a
                                                            href={userLocation 
                                                                ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${lawyer.latitude},${lawyer.longitude}`
                                                                : `https://www.google.com/maps/search/?api=1&query=${lawyer.latitude},${lawyer.longitude}`
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 bg-blue-500 text-white text-xs px-2 py-1.5 rounded font-bold hover:bg-blue-600 text-center"
                                                        >
                                                            📍 Google Maps
                                                        </a>
                                                    </div>
                                                    {/* Schedule Protocol Button */}
                                                    {(() => {
                                                        const existingAppt = appointments.find(a => a.providerId === lawyer.id && a.providerRole === "LAWYER");
                                                        const hasAppt = !!existingAppt;
                                                        const status = existingAppt?.status;
                                                        return (
                                                            <button
                                                                onClick={() => onBookAppointment({ ...lawyer, type: "LAWYER" }, caseDetail)}
                                                                disabled={hasAppt && status !== 'REJECTED' && status !== 'CANCELLED'}
                                                                className={`mt-2 w-full py-1.5 rounded text-xs font-bold transition-all ${hasAppt
                                                                    ? (status === 'CONFIRMED' || status === 'APPROVED')
                                                                        ? "bg-green-100 text-green-700 cursor-default"
                                                                        : (status === 'REJECTED' || status === 'CANCELLED')
                                                                            ? "bg-yellow-500 text-black hover:bg-yellow-600"
                                                                            : "bg-orange-100 text-orange-700 cursor-default"
                                                                    : "bg-yellow-500 text-black hover:bg-yellow-600"
                                                                }`}
                                                            >
                                                                {hasAppt
                                                                    ? (status === 'REJECTED' || status === 'CANCELLED')
                                                                        ? "⭐ Rebook"
                                                                        : (status === 'CONFIRMED' || status === 'APPROVED')
                                                                            ? "✓ Confirmed"
                                                                            : `⏳ ${status}`
                                                                    : "⭐ Schedule Protocol"}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                ))}

                                {/* Route Line for Selected Lawyer */}
                                {selectedLawyerForRoute && userLocation && (
                                    <RoutingLine 
                                        userLocation={userLocation} 
                                        destination={selectedLawyerForRoute} 
                                        color="#22c55e"
                                    />
                                )}
                            </MapContainer>
                        </div>

                        {/* Lawyer Distance List */}
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                            {lawyers.map((lawyer, idx) => (
                                <div
                                    key={lawyer.id}
                                    onClick={() => setSelectedLawyerForRoute(lawyer)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                        selectedLawyerForRoute?.id === lawyer.id 
                                            ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' 
                                            : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:border-green-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-sm font-bold text-green-600">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{lawyer.name}</p>
                                            <p className="text-xs text-gray-500">{lawyer.specialization} • {lawyer.city}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {lawyer.distance ? (
                                            <span className="text-sm font-bold text-green-600">{lawyer.distance.toFixed(1)} km</span>
                                        ) : (
                                            <span className="text-xs text-gray-400">N/A</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* NGOS MAP */}
                    <div className="bg-gray-50 dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#333] p-6 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                                NGOs Map
                                <span className="text-sm font-normal text-gray-500">({ngos.length} matched)</span>
                            </h3>
                            {selectedNgoForRoute && (
                                <button
                                    onClick={() => setSelectedNgoForRoute(null)}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold"
                                >
                                    Clear Route
                                </button>
                            )}
                        </div>

                        <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200 dark:border-[#333] mb-4">
                            <MapContainer
                                center={userLocation ? [userLocation.lat, userLocation.lng] : [20.5937, 78.9629]}
                                zoom={10}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <FitBounds bounds={ngoMapBounds} />

                                {/* User Marker */}
                                {userLocation && (
                                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                                        <Popup>
                                            <div className="text-center">
                                                <p className="font-bold text-blue-600">📍 Your Location</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {/* NGO Markers */}
                                {ngos.map((ngo) => (
                                    ngo.latitude && ngo.longitude && (
                                        <Marker
                                            key={ngo.id}
                                            position={[ngo.latitude, ngo.longitude]}
                                            icon={ngoIcon}
                                            eventHandlers={{
                                                click: () => setSelectedNgoForRoute(ngo)
                                            }}
                                        >
                                            <Popup>
                                                <div className="min-w-[220px]">
                                                    <p className="font-bold text-gray-900">{ngo.name}</p>
                                                    <p className="text-sm text-orange-600 font-semibold">{ngo.ngoType || "NGO"}</p>
                                                    <p className="text-sm text-gray-600">{ngo.city}, {ngo.state}</p>
                                                    {ngo.distance && (
                                                        <p className="text-sm font-bold text-blue-600 mt-1">
                                                            📍 {ngo.distance.toFixed(1)} km away
                                                        </p>
                                                    )}
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => setSelectedNgoForRoute(ngo)}
                                                            className="flex-1 bg-orange-500 text-white text-xs px-2 py-1.5 rounded font-bold hover:bg-orange-600"
                                                        >
                                                            Show Route
                                                        </button>
                                                        <a
                                                            href={userLocation 
                                                                ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${ngo.latitude},${ngo.longitude}`
                                                                : `https://www.google.com/maps/search/?api=1&query=${ngo.latitude},${ngo.longitude}`
                                                            }
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 bg-blue-500 text-white text-xs px-2 py-1.5 rounded font-bold hover:bg-blue-600 text-center"
                                                        >
                                                            📍 Google Maps
                                                        </a>
                                                    </div>
                                                    {/* Schedule Protocol Button */}
                                                    {(() => {
                                                        const existingAppt = appointments.find(a => a.providerId === ngo.id && a.providerRole === "NGO");
                                                        const hasAppt = !!existingAppt;
                                                        const status = existingAppt?.status;
                                                        return (
                                                            <button
                                                                onClick={() => onBookAppointment({ ...ngo, type: "NGO" }, caseDetail)}
                                                                disabled={hasAppt && status !== 'REJECTED' && status !== 'CANCELLED'}
                                                                className={`mt-2 w-full py-1.5 rounded text-xs font-bold transition-all ${hasAppt
                                                                    ? (status === 'CONFIRMED' || status === 'APPROVED')
                                                                        ? "bg-green-100 text-green-700 cursor-default"
                                                                        : (status === 'REJECTED' || status === 'CANCELLED')
                                                                            ? "bg-yellow-500 text-black hover:bg-yellow-600"
                                                                            : "bg-orange-100 text-orange-700 cursor-default"
                                                                    : "bg-yellow-500 text-black hover:bg-yellow-600"
                                                                }`}
                                                            >
                                                                {hasAppt
                                                                    ? (status === 'REJECTED' || status === 'CANCELLED')
                                                                        ? "⭐ Rebook"
                                                                        : (status === 'CONFIRMED' || status === 'APPROVED')
                                                                            ? "✓ Confirmed"
                                                                            : `⏳ ${status}`
                                                                    : "⭐ Schedule Protocol"}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )
                                ))}

                                {/* Route Line for Selected NGO */}
                                {selectedNgoForRoute && userLocation && (
                                    <RoutingLine 
                                        userLocation={userLocation} 
                                        destination={selectedNgoForRoute} 
                                        color="#f97316"
                                    />
                                )}
                            </MapContainer>
                        </div>

                        {/* NGO Distance List */}
                        <div className="max-h-[200px] overflow-y-auto space-y-2">
                            {ngos.map((ngo, idx) => (
                                <div
                                    key={ngo.id}
                                    onClick={() => setSelectedNgoForRoute(ngo)}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                                        selectedNgoForRoute?.id === ngo.id 
                                            ? 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-500' 
                                            : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] hover:border-orange-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm font-bold text-orange-600">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">{ngo.name}</p>
                                            <p className="text-xs text-gray-500">{ngo.ngoType || "NGO"} • {ngo.city}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {ngo.distance ? (
                                            <span className="text-sm font-bold text-orange-600">{ngo.distance.toFixed(1)} km</span>
                                        ) : (
                                            <span className="text-xs text-gray-400">N/A</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Cards View */}
            {viewMode === "cards" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {(activeTab === "lawyers" ? lawyers : ngos).map((item) => (
                        <div key={item.id} className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-2xl p-6 hover:border-[#D4AF37]/50 transition-all duration-500 group shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <FiShield size={80} className="text-[#D4AF37]" />
                            </div>

                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-xl font-bold text-[#D4AF37] shadow-inner group-hover:bg-[#D4AF37] group-hover:text-black transition-all">
                                    {item.name.charAt(0)}
                                </div>
                                <span className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs px-2.5 py-1 rounded-full font-bold border border-green-200 dark:border-green-700 flex items-center gap-1 shadow-sm transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    VERIFIED
                                </span>
                            </div>

                            <h3 className="font-bold text-xl text-gray-900 dark:text-white font-serif mb-2 tracking-tight group-hover:text-[#D4AF37] transition-colors">{item.name}</h3>

                            <div className="space-y-2 mb-4">
                                <div className="text-[10px] font-bold text-[#D4AF37] flex items-center gap-2 uppercase tracking-widest">
                                    <FiAward className="w-3 h-3" /> {activeTab === "lawyers" ? item.specialization : item.ngoType || "NGO"}
                                </div>
                                <div className="text-[10px] font-bold text-gray-600 dark:text-gray-500 flex items-center gap-2 uppercase tracking-widest transition-colors">
                                    <FiMapPin className="w-3 h-3" /> {item.city}, {item.state}
                                </div>
                                {item.distance && (
                                    <div className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-2 uppercase tracking-widest">
                                        <FiNavigation className="w-3 h-3" /> {item.distance.toFixed(1)} km away
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => setViewingDetail({ item, role: activeTab === "lawyers" ? "LAWYER" : "NGO" })}
                                className="w-full mb-4 py-2.5 rounded-xl border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                            >
                                <FiInfo className="w-3.5 h-3.5" /> View details
                            </button>

                            <div className="grid grid-cols-1 gap-3 pt-4 border-t border-gray-200 dark:border-[#222] transition-colors">
                                <button
                                    onClick={() => handleStartChat(item, activeTab === "lawyers" ? "LAWYER" : "NGO")}
                                    className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:text-gray-900 dark:hover:text-white hover:border-[#D4AF37] transition-all flex items-center justify-center gap-3 group/btn"
                                >
                                    <FiMessageSquare className="w-4 h-4 text-[#D4AF37] group-hover/btn:scale-110 transition-transform" /> Initiate Consultation
                                </button>
                                {(() => {
                                    const role = activeTab === "lawyers" ? "LAWYER" : "NGO";
                                    const existingAppt = appointments.find(a => a.providerId === item.id && a.providerRole === role);
                                    const hasAppt = !!existingAppt;
                                    const status = existingAppt?.status;

                                    return (
                                        <button
                                            onClick={() => onBookAppointment({ ...item, type: role }, caseDetail)}
                                            disabled={hasAppt && status !== 'REJECTED' && status !== 'CANCELLED'}
                                            className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 ${hasAppt
                                                ? (status === 'CONFIRMED' || status === 'APPROVED')
                                                    ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-900/50 cursor-default"
                                                    : (status === 'REJECTED' || status === 'CANCELLED')
                                                        ? "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                                        : "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 cursor-default"
                                                : "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                                }`}
                                        >
                                            <FiStar className={`w-4 h-4 ${hasAppt ? 'opacity-40' : 'opacity-100'}`} />
                                            {hasAppt
                                                ? (status === 'REJECTED' || status === 'CANCELLED')
                                                    ? "Rebook Encounter"
                                                    : `Phase: ${status}`
                                                : "Schedule Protocol"}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    ))}

                    {(activeTab === "lawyers" ? lawyers : ngos).length === 0 && (
                        <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-[#111] border border-dashed border-gray-300 dark:border-[#333] rounded-2xl flex flex-col items-center transition-colors">
                            <FiUser className="w-16 h-16 text-gray-400 dark:text-gray-800 mb-6 opacity-20 transition-colors" />
                            <p className="text-gray-600 dark:text-gray-500 font-bold uppercase tracking-widest text-xs mb-6 px-10 max-w-lg leading-relaxed transition-colors">No direct matches identified in this tier based on current case parameters.</p>
                            <button
                                onClick={() => setActivePage("find")}
                                className="bg-[#D4AF37] text-black px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#c5a059] transition-all shadow-xl shadow-[#D4AF37]/10"
                            >
                                Access Full Registry Manually
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Detail modal */}
            {viewingDetail && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setViewingDetail(null)}
                >
                    <div
                        className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl flex flex-col ${isDark ? "bg-[#0f0f0f] border-[#333]" : "bg-white border-gray-200"}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${isDark ? "bg-[#0f0f0f] border-[#222]" : "bg-gray-50 border-gray-200"}`}>
                            <h3 className={`text-lg font-bold font-serif ${isDark ? "text-white" : "text-gray-900"}`}>
                                {viewingDetail.role === "LAWYER" ? "Lawyer details" : "NGO details"}
                            </h3>
                            <button
                                onClick={() => setViewingDetail(null)}
                                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-200 text-gray-600"}`}
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            {viewingDetail.role === "LAWYER" ? (
                                <>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Name</p>
                                        <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{viewingDetail.item.name || viewingDetail.item.fullName}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Specialization</p>
                                        <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.specialization || "—"}</p>
                                    </div>
                                    {(viewingDetail.item.experienceYears ?? viewingDetail.item.experience) != null && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Experience</p>
                                            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.experienceYears ?? viewingDetail.item.experience} years</p>
                                        </div>
                                    )}
                                    {viewingDetail.item.distance && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Distance from You</p>
                                            <p className="text-green-600 dark:text-green-400 font-bold flex items-center gap-2">
                                                <FiNavigation className="w-4 h-4" /> {viewingDetail.item.distance.toFixed(1)} km
                                            </p>
                                        </div>
                                    )}
                                    {(viewingDetail.item.barCouncilId || viewingDetail.item.barState) && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Bar Council</p>
                                            <p className={isDark ? "text-gray-300" : "text-gray-700"}>
                                                {[viewingDetail.item.barCouncilId, viewingDetail.item.barState].filter(Boolean).join(" • ") || "—"}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Location</p>
                                        <p className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            <FiMapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                                            {[viewingDetail.item.city, viewingDetail.item.district, viewingDetail.item.state].filter(Boolean).join(", ") || "—"}
                                        </p>
                                    </div>
                                    {viewingDetail.item.address && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Address</p>
                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{viewingDetail.item.address}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {viewingDetail.item.email && (
                                            <div className="flex items-center gap-2">
                                                <FiMail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`mailto:${viewingDetail.item.email}`} className={`text-sm truncate hover:underline ${isDark ? "text-[#D4AF37]" : "text-[#c5a059]"}`}>
                                                    {viewingDetail.item.email}
                                                </a>
                                            </div>
                                        )}
                                        {(viewingDetail.item.mobileNum || viewingDetail.item.mobile_number) && (
                                            <div className="flex items-center gap-2">
                                                <FiPhone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`tel:${viewingDetail.item.mobileNum || viewingDetail.item.mobile_number}`} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                    {viewingDetail.item.mobileNum || viewingDetail.item.mobile_number}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    {viewingDetail.item.verificationStatus !== false || viewingDetail.item.isVerified ? (
                                        <div className="flex items-center gap-2 pt-2">
                                            <FiShield className="w-4 h-4 text-[#D4AF37]" />
                                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Verified professional</span>
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Name</p>
                                        <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{viewingDetail.item.name || viewingDetail.item.ngoName}</p>
                                    </div>
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Type</p>
                                        <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.ngoType || "—"}</p>
                                    </div>
                                    {viewingDetail.item.registrationNumber && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Registration number</p>
                                            <p className={isDark ? "text-gray-300" : "text-gray-700"}>{viewingDetail.item.registrationNumber}</p>
                                        </div>
                                    )}
                                    {viewingDetail.item.distance && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Distance from You</p>
                                            <p className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2">
                                                <FiNavigation className="w-4 h-4" /> {viewingDetail.item.distance.toFixed(1)} km
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Location</p>
                                        <p className={`flex items-center gap-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                            <FiMapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                                            {[viewingDetail.item.city, viewingDetail.item.district, viewingDetail.item.state].filter(Boolean).join(", ") || "—"}
                                            {viewingDetail.item.pincode && ` ${viewingDetail.item.pincode}`}
                                        </p>
                                    </div>
                                    {viewingDetail.item.address && (
                                        <div>
                                            <p className={`text-[10px] font-black text-[#D4AF37] uppercase tracking-widest mb-1`}>Address</p>
                                            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{viewingDetail.item.address}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {viewingDetail.item.email && (
                                            <div className="flex items-center gap-2">
                                                <FiMail className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`mailto:${viewingDetail.item.email}`} className={`text-sm truncate hover:underline ${isDark ? "text-[#D4AF37]" : "text-[#c5a059]"}`}>
                                                    {viewingDetail.item.email}
                                                </a>
                                            </div>
                                        )}
                                        {(viewingDetail.item.contact) && (
                                            <div className="flex items-center gap-2">
                                                <FiPhone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                                                <a href={`tel:${viewingDetail.item.contact}`} className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                    {viewingDetail.item.contact}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                    {viewingDetail.item.verificationStatus !== false || viewingDetail.item.isVerified ? (
                                        <div className="flex items-center gap-2 pt-2">
                                            <FiShield className="w-4 h-4 text-[#D4AF37]" />
                                            <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Verified organization</span>
                                        </div>
                                    ) : null}
                                </>
                            )}
                        </div>
                        <div className={`p-6 pt-4 flex flex-wrap gap-3 border-t ${isDark ? "border-[#222]" : "border-gray-200"}`}>
                            <button
                                onClick={() => {
                                    handleStartChat(viewingDetail.item, viewingDetail.role);
                                    setViewingDetail(null);
                                }}
                                className="flex-1 min-w-[140px] py-3 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                <FiMessageSquare className="w-4 h-4" /> Message
                            </button>
                            {(() => {
                                const existingAppt = appointments.find(a => a.providerId === viewingDetail.item.id && a.providerRole === viewingDetail.role);
                                const hasAppt = !!existingAppt;
                                const status = existingAppt?.status;
                                const canRebook = hasAppt && (status === "REJECTED" || status === "CANCELLED");
                                const disabled = hasAppt && !canRebook;
                                return (
                                    <button
                                        onClick={() => {
                                            if (disabled) return;
                                            onBookAppointment({ ...viewingDetail.item, type: viewingDetail.role }, caseDetail);
                                            setViewingDetail(null);
                                        }}
                                        disabled={disabled}
                                        className={`flex-1 min-w-[140px] py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${disabled
                                            ? "bg-gray-200 dark:bg-[#222] text-gray-500 dark:text-gray-500 cursor-not-allowed"
                                            : canRebook
                                                ? "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                                : "bg-[#D4AF37] text-black hover:bg-[#c5a059]"
                                            }`}
                                    >
                                        <FiStar className="w-4 h-4" />
                                        {hasAppt ? (canRebook ? "Rebook" : `Phase: ${status}`) : "Schedule"}
                                    </button>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext.jsx";
import axiosClient from "../../api/axiosClient";
import { FiTrendingUp, FiShield, FiUsers, FiActivity, FiDatabase, FiCheckCircle, FiFileText, FiUser, FiBarChart2, FiPieChart, FiMapPin, FiMail, FiPhone, FiMap } from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Popup, Tooltip as LeafletTooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default Leaflet icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from "recharts";

export default function AdminOverview() {
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    totalCases: 0,
    totalCitizens: 0,
    lawyers: 0,
    ngos: 0,
    verifiedLawyers: 0,
    verifiedNGOs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);
  const [ngos, setNGOs] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
    fetchMapData();
    // Refresh stats, analytics, and map data every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchStats();
      fetchAnalytics();
      fetchMapData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      console.log("Fetching admin stats from /admin/stats");

      // Try the new stats endpoint first
      try {
        const response = await axiosClient.get("/admin/stats");
        console.log("Admin stats response:", response);
        console.log("Admin stats data:", response.data);

        const data = response.data;

        if (data && typeof data === 'object') {
          setStats({
            totalCases: Number(data.totalCases) || 0,
            totalCitizens: Number(data.totalCitizens) || 0,
            lawyers: Number(data.lawyers) || 0,
            ngos: Number(data.ngos) || 0,
            verifiedLawyers: Number(data.verifiedLawyers) || 0,
            verifiedNGOs: Number(data.verifiedNGOs) || 0,
          });
          console.log("Stats updated from /admin/stats:", {
            totalCases: Number(data.totalCases) || 0,
            totalCitizens: Number(data.totalCitizens) || 0,
            lawyers: Number(data.lawyers) || 0,
            ngos: Number(data.ngos) || 0,
          });
          return; // Success, exit early
        }
      } catch (statsError) {
        console.warn("Stats endpoint failed, falling back to individual endpoints:", statsError);
        // Fall through to fallback method
      }

      // Fallback: Fetch from individual endpoints
      console.log("Using fallback method to fetch stats");
      const [casesRes, citizensRes, lawyersRes, ngosRes] = await Promise.all([
        axiosClient.get("/cases/debug/all").catch(() => ({ data: [] })),
        axiosClient.get("/citizens").catch(() => ({ data: [] })),
        axiosClient.get("/lawyers?page=0&size=1000").catch(() => ({ data: { content: [] } })),
        axiosClient.get("/ngos?page=0&size=1000").catch(() => ({ data: { content: [] } })),
      ]);

      const cases = casesRes.data || [];
      const citizens = citizensRes.data || [];
      const lawyers = lawyersRes.data?.content || lawyersRes.data || [];
      const ngos = ngosRes.data?.content || ngosRes.data || [];

      setStats({
        totalCases: Array.isArray(cases) ? cases.length : 0,
        totalCitizens: Array.isArray(citizens) ? citizens.length : 0,
        lawyers: Array.isArray(lawyers) ? lawyers.length : 0,
        ngos: Array.isArray(ngos) ? ngos.length : 0,
        verifiedLawyers: Array.isArray(lawyers) ? lawyers.filter((l) => l.verificationStatus).length : 0,
        verifiedNGOs: Array.isArray(ngos) ? ngos.filter((n) => n.verificationStatus).length : 0,
      });

      console.log("Stats updated from fallback method:", {
        totalCases: Array.isArray(cases) ? cases.length : 0,
        totalCitizens: Array.isArray(citizens) ? citizens.length : 0,
        lawyers: Array.isArray(lawyers) ? lawyers.length : 0,
        ngos: Array.isArray(ngos) ? ngos.length : 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      // Set to 0 on error to show that data couldn't be loaded
      setStats({
        totalCases: 0,
        totalCitizens: 0,
        lawyers: 0,
        ngos: 0,
        verifiedLawyers: 0,
        verifiedNGOs: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      console.log("Fetching analytics from /admin/analytics");

      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const response = await Promise.race([
        axiosClient.get("/admin/analytics"),
        timeoutPromise
      ]);

      console.log("Analytics response:", response);
      console.log("Analytics data:", response.data);

      if (response && response.data && typeof response.data === 'object') {
        setAnalytics(response.data);
        console.log("Analytics set successfully");
      } else {
        console.warn("Invalid analytics data format:", response?.data);
        setAnalytics({}); // Set empty object instead of null
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      console.error("Error response:", error.response);
      console.error("Error status:", error.response?.status);
      console.error("Error message:", error.message);

      // Set empty object so charts can still render (even if empty)
      setAnalytics({});
    } finally {
      console.log("Setting analyticsLoading to false");
      setAnalyticsLoading(false);
    }
  };

  const importBarCouncilData = async () => {
    try {
      if (confirm("Initiate Bar Council Synchronisation? This protocol allows for the verification of new legal entities.")) {
        await axiosClient.post("/lawyers/admin/import-bar-council");
        alert("Synchronisation complete. Legal entity verification channels are now open.");
        // Refresh stats, analytics, and map data after import
        fetchStats();
        fetchAnalytics();
        fetchMapData();
      }
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  // Helper function to convert object to chart data
  const objectToChartData = (obj) => {
    if (!obj) return [];
    return Object.entries(obj).map(([name, value]) => ({
      name: name || "Unknown",
      value: Number(value) || 0,
    }));
  };

  // Helper function to combine time-based data for line chart
  const combineTimeData = (casesObj, lawyersObj, ngosObj) => {
    if (!casesObj && !lawyersObj && !ngosObj) return [];

    const allDates = new Set();
    if (casesObj) Object.keys(casesObj).forEach(d => allDates.add(d));
    if (lawyersObj) Object.keys(lawyersObj).forEach(d => allDates.add(d));
    if (ngosObj) Object.keys(ngosObj).forEach(d => allDates.add(d));

    return Array.from(allDates).sort().map(date => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Cases: Number(casesObj?.[date] || 0),
      Lawyers: Number(lawyersObj?.[date] || 0),
      NGOs: Number(ngosObj?.[date] || 0),
    }));
  };

  // Helper function to convert weekly trends to chart data
  const weeklyTrendsToChartData = (weeklyTrends) => {
    if (!weeklyTrends || typeof weeklyTrends !== 'object') return [];
    return Object.entries(weeklyTrends).map(([week, data]) => ({
      week,
      Cases: Number(data?.Cases || 0),
      Lawyers: Number(data?.Lawyers || 0),
      NGOs: Number(data?.NGOs || 0),
    }));
  };

  // Fetch lawyers and NGOs for map
  const fetchMapData = async () => {
    try {
      setMapLoading(true);
      const [lawyersRes, ngosRes] = await Promise.all([
        axiosClient.get("/lawyers?page=0&size=1000").catch(() => ({ data: { content: [] } })),
        axiosClient.get("/ngos?page=0&size=1000").catch(() => ({ data: { content: [] } })),
      ]);

      const lawyersData = lawyersRes.data?.content || lawyersRes.data || [];
      const ngosData = ngosRes.data?.content || ngosRes.data || [];

      // Filter only those with valid coordinates
      const lawyersWithCoords = Array.isArray(lawyersData)
        ? lawyersData.filter(l => l.latitude && l.longitude &&
          typeof l.latitude === 'number' && typeof l.longitude === 'number')
        : [];

      const ngosWithCoords = Array.isArray(ngosData)
        ? ngosData.filter(n => n.latitude && n.longitude &&
          typeof n.latitude === 'number' && typeof n.longitude === 'number')
        : [];

      setLawyers(lawyersWithCoords);
      setNGOs(ngosWithCoords);
    } catch (error) {
      console.error("Error fetching map data:", error);
      setLawyers([]);
      setNGOs([]);
    } finally {
      setMapLoading(false);
    }
  };

  // Create custom icons for markers
  const createCustomIcon = (color, type) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 3px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 14px;
          ">${type === 'lawyer' ? 'L' : 'N'}</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  };

  const lawyerIcon = createCustomIcon('#3498DB', 'lawyer');
  const ngoIcon = createCustomIcon('#2ECC71', 'ngo');

  // Vibrant color palettes for charts
  const COLORS = [
    "#D4AF37", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A",
    "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B739",
    "#E74C3C", "#3498DB", "#2ECC71", "#9B59B6", "#1ABC9C",
    "#F39C12", "#E67E22", "#16A085", "#27AE60", "#2980B9"
  ];

  const GRADIENT_COLORS = {
    primary: { start: "#D4AF37", end: "#F4D03F" },
    success: { start: "#2ECC71", end: "#27AE60" },
    danger: { start: "#E74C3C", end: "#C0392B" },
    info: { start: "#3498DB", end: "#2980B9" },
    warning: { start: "#F39C12", end: "#E67E22" },
    purple: { start: "#9B59B6", end: "#8E44AD" },
    teal: { start: "#1ABC9C", end: "#16A085" },
  };

  return (
    <div className="space-y-10 font-sans">
      {/* WELCOME CARD */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-3xl p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
          <FiShield size={140} className="text-[#D4AF37]" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">System Administrator Command</span>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white font-serif tracking-tight mb-4">Supreme Governance Console</h1>
          <p className="text-gray-600 dark:text-gray-500 text-lg leading-relaxed mb-8">
            Overseeing <span className="text-gray-900 dark:text-white font-bold">{stats.totalCases} cases</span>, <span className="text-gray-900 dark:text-white font-bold">{stats.totalCitizens} citizens</span>, <span className="text-gray-900 dark:text-white font-bold">{stats.lawyers} legal practitioners</span>, and <span className="text-gray-900 dark:text-white font-bold">{stats.ngos} social organizations</span>. Network integrity is steady.
          </p>
          <button
            onClick={importBarCouncilData}
            className="bg-[#D4AF37] text-black px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#c5a059] transition-all shadow-xl shadow-[#D4AF37]/20 flex items-center gap-3"
          >
            <FiDatabase size={16} /> Sync External Registers
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Cases" value={loading ? "..." : stats.totalCases} icon={<FiFileText />} />
        <StatCard title="Citizens" value={loading ? "..." : stats.totalCitizens} icon={<FiUser />} />
        <StatCard title="Legal Providers" value={loading ? "..." : stats.lawyers} icon={<FiBriefcaseIcon />} />
        <StatCard title="NGO Networks" value={loading ? "..." : stats.ngos} icon={<FiUsers />} />
      </div>

      {/* INTERACTIVE MAP */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiMap className="text-[#D4AF37] w-6 h-6" />
            <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">Geographic Distribution Map</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#3498DB] border-2 border-white dark:border-white"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Lawyers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#2ECC71] border-2 border-white dark:border-white"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">NGOs</span>
            </div>
          </div>
        </div>

        {mapLoading ? (
          <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading map data...</p>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl overflow-hidden" style={{ height: "600px" }}>
            <MapContainer
              center={[20.5937, 78.9629]} // Center of India
              zoom={5}
              style={{ height: "100%", width: "100%", zIndex: 0 }}
              className={theme === 'dark' ? "dark-map" : "light-map"}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Lawyers Markers */}
              {lawyers.map((lawyer) => (
                <Marker
                  key={`lawyer-${lawyer.id}`}
                  position={[lawyer.latitude, lawyer.longitude]}
                  icon={lawyerIcon}
                >
                  <LeafletTooltip
                    className="custom-tooltip"
                    permanent={false}
                    direction="top"
                    offset={[0, -10]}
                  >
                    <div className="p-2 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border border-gray-200 dark:border-[#333] rounded-lg shadow-xl min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#3498DB]"></div>
                        <h4 className="font-bold text-sm text-[#D4AF37]">{lawyer.fullName || "Lawyer"}</h4>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-500">Specialization:</span> {lawyer.specialization || "N/A"}</p>
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-500">Location:</span> {lawyer.city || "N/A"}, {lawyer.state || "N/A"}</p>
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-500">Contact:</span> {lawyer.mobileNum || "N/A"}</p>
                      </div>
                    </div>
                  </LeafletTooltip>
                  <Popup className="custom-popup">
                    <div className="p-3 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white min-w-[250px]">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-[#333]">
                        <div className="w-3 h-3 rounded-full bg-[#3498DB]"></div>
                        <h4 className="font-bold text-lg text-[#D4AF37]">{lawyer.fullName || "Lawyer"}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <FiBriefcaseIcon className="text-[#3498DB] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Specialization</p>
                            <p className="text-gray-900 dark:text-white">{lawyer.specialization || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiMapPin className="text-[#3498DB] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Location</p>
                            <p className="text-gray-900 dark:text-white">{lawyer.city || "N/A"}, {lawyer.state || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiPhone className="text-[#3498DB] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Contact</p>
                            <p className="text-gray-900 dark:text-white">{lawyer.mobileNum || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiMail className="text-[#3498DB] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Email</p>
                            <p className="text-gray-900 dark:text-white break-all">{lawyer.email || "N/A"}</p>
                          </div>
                        </div>
                        {lawyer.experienceYears && (
                          <div className="flex items-start gap-2">
                            <FiTrendingUp className="text-[#3498DB] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Experience</p>
                              <p className="text-gray-900 dark:text-white">{lawyer.experienceYears} years</p>
                            </div>
                          </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-[#333]">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${lawyer.verificationStatus
                            ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                            : "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                            }`}>
                            {lawyer.verificationStatus ? "✓ Verified" : "Unverified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* NGOs Markers */}
              {ngos.map((ngo) => (
                <Marker
                  key={`ngo-${ngo.id}`}
                  position={[ngo.latitude, ngo.longitude]}
                  icon={ngoIcon}
                >
                  <LeafletTooltip
                    className="custom-tooltip"
                    permanent={false}
                    direction="top"
                    offset={[0, -10]}
                  >
                    <div className="p-2 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white border border-gray-200 dark:border-[#333] rounded-lg shadow-xl min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-[#2ECC71]"></div>
                        <h4 className="font-bold text-sm text-[#D4AF37]">{ngo.ngoName || "NGO"}</h4>
                      </div>
                      <div className="text-xs space-y-1">
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-500">Type:</span> {ngo.ngoType || "N/A"}</p>
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-500">Location:</span> {ngo.city || "N/A"}, {ngo.state || "N/A"}</p>
                        <p className="text-gray-700 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-500">Contact:</span> {ngo.contact || "N/A"}</p>
                      </div>
                    </div>
                  </LeafletTooltip>
                  <Popup className="custom-popup">
                    <div className="p-3 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white min-w-[250px]">
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-[#333]">
                        <div className="w-3 h-3 rounded-full bg-[#2ECC71]"></div>
                        <h4 className="font-bold text-lg text-[#D4AF37]">{ngo.ngoName || "NGO"}</h4>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <FiUsers className="text-[#2ECC71] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Type</p>
                            <p className="text-gray-900 dark:text-white">{ngo.ngoType || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiMapPin className="text-[#2ECC71] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Location</p>
                            <p className="text-gray-900 dark:text-white">{ngo.city || "N/A"}, {ngo.state || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiPhone className="text-[#2ECC71] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Contact</p>
                            <p className="text-gray-900 dark:text-white">{ngo.contact || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <FiMail className="text-[#2ECC71] mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Email</p>
                            <p className="text-gray-900 dark:text-white break-all">{ngo.email || "N/A"}</p>
                          </div>
                        </div>
                        {ngo.registrationNumber && (
                          <div className="flex items-start gap-2">
                            <FiCheckCircle className="text-[#2ECC71] mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Registration</p>
                              <p className="text-gray-900 dark:text-white text-xs">{ngo.registrationNumber}</p>
                            </div>
                          </div>
                        )}
                        <div className="pt-2 mt-2 border-t border-gray-200 dark:border-[#333]">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${ngo.verificationStatus
                            ? "bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30"
                            : "bg-gray-500/20 text-gray-600 dark:text-gray-400 border border-gray-500/30"
                            }`}>
                            {ngo.verificationStatus ? "✓ Verified" : "Unverified"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-600 dark:text-gray-500 text-center">
          Showing {lawyers.length} lawyers and {ngos.length} NGOs with location data
        </div>
      </div>

      {/* ANALYTICS CHARTS */}
      {!analyticsLoading && analytics && Object.keys(analytics).length > 0 && (
        <div className="space-y-6">
          {/* Cases Analytics */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <FiBarChart2 className="text-[#D4AF37] w-6 h-6" />
              <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">Cases Analytics</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cases by Specialization */}
              {analytics.casesBySpecialization && Object.keys(analytics.casesBySpecialization).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases by Specialization</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={objectToChartData(analytics.casesBySpecialization)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {objectToChartData(analytics.casesBySpecialization).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", color: theme === 'dark' ? "#ccc" : "#666" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cases by Type */}
              {analytics.casesByType && Object.keys(analytics.casesByType).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases by Type</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={objectToChartData(analytics.casesByType)}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#333" : "#e5e7eb"} strokeOpacity={0.2} />
                      <XAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} dataKey="name" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={11} />
                      <YAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={11} width={30} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cases by Status */}
              {analytics.casesByStatus && Object.keys(analytics.casesByStatus).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases by Status</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={objectToChartData(analytics.casesByStatus)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {objectToChartData(analytics.casesByStatus).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", color: theme === 'dark' ? "#ccc" : "#666" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cases by Urgency */}
              {analytics.casesByUrgency && Object.keys(analytics.casesByUrgency).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases by Urgency</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={objectToChartData(analytics.casesByUrgency)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} dataKey="name" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                      <YAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cases by Victim Gender */}
              {analytics.casesByGender && Object.keys(analytics.casesByGender).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases by Victim Gender</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={objectToChartData(analytics.casesByGender)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {objectToChartData(analytics.casesByGender).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", color: theme === 'dark' ? "#ccc" : "#666" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cases by Age Group */}
              {analytics.casesByAgeGroup && Object.keys(analytics.casesByAgeGroup).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases by Victim Age Group</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={objectToChartData(analytics.casesByAgeGroup)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} dataKey="name" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                      <YAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#4ECDC4" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cases by Court Type */}
              {analytics.casesByCourtType && Object.keys(analytics.casesByCourtType).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases by Court Type</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={objectToChartData(analytics.casesByCourtType)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} dataKey="name" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={11} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#9B59B6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Cases Seeking NGO Help */}
              {analytics.casesSeekingNGO && Object.keys(analytics.casesSeekingNGO).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Cases Seeking NGO Help</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={objectToChartData(analytics.casesSeekingNGO)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {objectToChartData(analytics.casesSeekingNGO).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", color: theme === 'dark' ? "#ccc" : "#666" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Lawyers Analytics */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <FiBriefcaseIcon className="text-[#D4AF37] w-6 h-6" />
              <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">Lawyers Analytics</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lawyers by Specialization */}
              {analytics.lawyersBySpecialization && Object.keys(analytics.lawyersBySpecialization).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Lawyers by Specialization</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={objectToChartData(analytics.lawyersBySpecialization)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Lawyers by Verification */}
              {analytics.lawyersByVerification && Object.keys(analytics.lawyersByVerification).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Lawyers by Verification Status</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={objectToChartData(analytics.lawyersByVerification)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {objectToChartData(analytics.lawyersByVerification).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", color: theme === 'dark' ? "#ccc" : "#666" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Lawyers by City (Top 10) */}
              {analytics.lawyersByCity && Object.keys(analytics.lawyersByCity).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Top 10 Cities - Lawyers</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={objectToChartData(analytics.lawyersByCity)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#45B7D1" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Lawyers by Experience */}
              {analytics.lawyersByExperience && Object.keys(analytics.lawyersByExperience).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Lawyers by Experience</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={objectToChartData(analytics.lawyersByExperience)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} dataKey="name" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                      <YAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#2ECC71" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* NGOs Analytics */}
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <FiUsers className="text-[#D4AF37] w-6 h-6" />
              <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">NGOs Analytics</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* NGOs by Type */}
              {analytics.ngosByType && Object.keys(analytics.ngosByType).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">NGOs by Type</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={objectToChartData(analytics.ngosByType)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#FF6B6B" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* NGOs by Verification */}
              {analytics.ngosByVerification && Object.keys(analytics.ngosByVerification).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">NGOs by Verification Status</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={objectToChartData(analytics.ngosByVerification)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {objectToChartData(analytics.ngosByVerification).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px", color: theme === 'dark' ? "#ccc" : "#666" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* NGOs by City (Top 10) */}
              {analytics.ngosByCity && Object.keys(analytics.ngosByCity).length > 0 && (
                <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Top 10 Cities - NGOs</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={objectToChartData(analytics.ngosByCity)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#888" fontSize={12} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#888" fontSize={12} />
                      <Tooltip
                        itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                        labelStyle={{ color: '#D4AF37' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                          border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                          borderRadius: "8px",
                          color: theme === 'dark' ? "#fff" : "#000",
                        }}
                      />
                      <Bar dataKey="value" fill="#1ABC9C" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Time-based Analytics - Daily Trends */}
          {(analytics.casesOverTime || analytics.lawyersOverTime || analytics.ngosOverTime) && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <FiTrendingUp className="text-[#D4AF37] w-6 h-6" />
                <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">Daily Registration Trends (Last 30 Days)</h3>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart
                    data={combineTimeData(analytics.casesOverTime, analytics.lawyersOverTime, analytics.ngosOverTime)}
                    margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                  >
                    <defs>
                      <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorLawyers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3498DB" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3498DB" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorNGOs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2ECC71" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      tick={{ fill: '#9CA3AF' }}
                      dataKey="date"
                      stroke="#888"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#D4AF37' }}
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: theme === 'dark' ? "#fff" : "#000", paddingTop: "20px" }}
                    />
                    {analytics.casesOverTime && (
                      <Area
                        type="monotone"
                        dataKey="Cases"
                        stroke="#D4AF37"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorCases)"
                      />
                    )}
                    {analytics.lawyersOverTime && (
                      <Area
                        type="monotone"
                        dataKey="Lawyers"
                        stroke="#3498DB"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorLawyers)"
                      />
                    )}
                    {analytics.ngosOverTime && (
                      <Area
                        type="monotone"
                        dataKey="NGOs"
                        stroke="#2ECC71"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorNGOs)"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Weekly Trends */}
          {analytics.weeklyTrends && Object.keys(analytics.weeklyTrends).length > 0 && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <FiBarChart2 className="text-[#D4AF37] w-6 h-6" />
                <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">Weekly Registration Trends (Last 4 Weeks)</h3>
              </div>
              <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={weeklyTrendsToChartData(analytics.weeklyTrends)}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#333" : "#e5e7eb"} />
                    <XAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} dataKey="week" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={11} />
                    <YAxis stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                    <Tooltip
                      itemStyle={{ color: '#fff' }}
                      labelStyle={{ color: '#D4AF37' }}
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ color: theme === 'dark' ? "#fff" : "#000" }}
                    />
                    <Bar dataKey="Cases" fill="#D4AF37" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="Lawyers" fill="#3498DB" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="NGOs" fill="#2ECC71" radius={[8, 8, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Geographic Distribution */}
          {(analytics.lawyersByState || analytics.ngosByState) && (
            <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <FiUsers className="text-[#D4AF37] w-6 h-6" />
                <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">Geographic Distribution by State</h3>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {analytics.lawyersByState && Object.keys(analytics.lawyersByState).length > 0 && (
                  <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">Lawyers by State</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={objectToChartData(analytics.lawyersByState)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280' }} dataKey="name" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={10} angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                        <Tooltip
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                          labelStyle={{ color: '#D4AF37' }}
                          contentStyle={{
                            backgroundColor: theme === 'dark' ? "#1a1a1a" : "#fff",
                            border: theme === 'dark' ? "1px solid #333" : "1px solid #e5e7eb",
                            borderRadius: "8px",
                            color: theme === 'dark' ? "#fff" : "#000",
                          }}
                        />
                        <Bar dataKey="value" fill="#E74C3C" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {analytics.ngosByState && Object.keys(analytics.ngosByState).length > 0 && (
                  <div className="bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl p-4">
                    <h4 className="text-sm font-bold text-gray-700 dark:text-gray-400 mb-4 uppercase tracking-wider">NGOs by State</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={objectToChartData(analytics.ngosByState)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={11} angle={-45} textAnchor="end" height={100} />
                        <YAxis stroke={theme === 'dark' ? "#888" : "#9CA3AF"} fontSize={12} />
                        <Tooltip
                          itemStyle={{ color: '#fff' }}
                          labelStyle={{ color: '#D4AF37' }}
                          contentStyle={{
                            backgroundColor: "#1a1a1a",
                            border: "1px solid #333",
                            borderRadius: "8px",
                            color: "#fff",
                          }}
                        />
                        <Bar dataKey="value" fill="#9B59B6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {analyticsLoading && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-xl text-center">
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      )}

      {!analyticsLoading && (!analytics || Object.keys(analytics).length === 0) && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 shadow-xl text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-2">No analytics data available</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
            Please ensure:
            <br />1. The backend is running
            <br />2. The backend has been restarted to load the new /admin/analytics endpoint
            <br />3. You are logged in as an ADMIN user
          </p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-[#D4AF37] text-black rounded-lg hover:bg-[#c5a059] transition font-bold text-sm"
          >
            Retry Loading Analytics
          </button>
        </div>
      )}

      {/* RECENT ACTIVITY */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-8 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <FiActivity className="text-[#D4AF37] w-6 h-6" />
            <h3 className="font-bold text-gray-900 dark:text-white font-serif tracking-tight text-xl">Real-time Telemetry</h3>
          </div>
          <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20 animate-pulse">
            Relay Active
          </span>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Global encryption channels initialized.</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-600">Just Now</span>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl flex items-center justify-between group hover:border-[#D4AF37]/30 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-[#D4AF37]"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Administrative session started in root tier.</span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-600">2m Ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const FiBriefcaseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
);

// Add custom styles for map popup and tooltip
const mapStyles = `
  .custom-popup .leaflet-popup-content-wrapper {
    background: transparent;
    box-shadow: none;
    padding: 0;
  }
  .custom-popup .leaflet-popup-content {
    margin: 0;
    padding: 0;
  }
  .custom-popup .leaflet-popup-tip {
    background: var(--popup-bg, #1a1a1a);
    border: 1px solid var(--popup-border, #333);
  }
  .custom-tooltip .leaflet-tooltip-content-wrapper {
    background: transparent;
    box-shadow: none;
    padding: 0;
    border: none;
  }
  .custom-tooltip .leaflet-tooltip-content {
    margin: 0;
    padding: 0;
  }
  .custom-tooltip .leaflet-tooltip-tip-section {
    background: var(--tooltip-bg, #1a1a1a);
    border: 1px solid var(--tooltip-border, #333);
  }
  .dark-map .leaflet-container {
    background: #111;
  }
  .light-map .leaflet-container {
    background: #f9fafb;
  }
  .custom-marker {
    background: transparent !important;
    border: none !important;
  }
  .leaflet-marker-icon {
    transition: transform 0.2s ease;
  }
  .leaflet-marker-icon:hover {
    transform: scale(1.2);
    z-index: 1000 !important;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = mapStyles;
  document.head.appendChild(styleSheet);
}

/* ===== STAT CARD ===== */
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-2xl p-6 shadow-xl flex items-center gap-5 hover:border-[#D4AF37]/50 transition-all duration-300 group">
    <div className={`w-14 h-14 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-2xl flex items-center justify-center ${color || 'text-[#D4AF37]'} group-hover:scale-110 transition-transform shadow-inner`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-black text-gray-500 dark:text-gray-500 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white font-serif tracking-tight">{value}</p>
    </div>
  </div>
);

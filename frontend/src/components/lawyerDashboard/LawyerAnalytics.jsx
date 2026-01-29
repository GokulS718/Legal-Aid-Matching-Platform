import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Line, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import ViewAppointmentModal from '../Dashboard/ViewAppointmentModal';
import { toast } from 'react-toastify';
import axios from 'axios';

// API Configuration
const API_BASE_URL = "http://localhost:8080/api";

export default function LawyerAnalytics({ profile }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [comparisonMode, setComparisonMode] = useState(false);
    const [comparisonLawyer, setComparisonLawyer] = useState(null);
    const [comparisonData, setComparisonData] = useState(null);
    const [lawyersList, setLawyersList] = useState([]);
    const [loadingComparison, setLoadingComparison] = useState(false);


    useEffect(() => {
        // Get lawyer ID from profile or localStorage
        let lawyerId = profile?.id;
        if (!lawyerId) {
            const userId = localStorage.getItem("userId");
            if (userId) {
                lawyerId = parseInt(userId);
            }
        }

        if (lawyerId) {
            fetchAnalytics();
            fetchLawyersList();
        } else {
            // If no profile id, still stop loading and show message
            setLoading(false);
            console.warn("Profile ID not available:", profile);
            console.warn("localStorage userId:", localStorage.getItem("userId"));
        }

        const handleUpdate = () => {
            const id = profile?.id || parseInt(localStorage.getItem("userId"));
            if (id) {
                fetchAnalytics();
            }
        };
        window.addEventListener('appointmentUpdated', handleUpdate);
        return () => window.removeEventListener('appointmentUpdated', handleUpdate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile]);

    useEffect(() => {
        if (comparisonMode && comparisonLawyer) {
            fetchComparisonData();
        } else {
            setComparisonData(null);
        }
    }, [comparisonMode, comparisonLawyer]);

    const fetchAnalytics = async () => {
        // Get lawyer ID from profile or localStorage
        let lawyerId = profile?.id;
        if (!lawyerId) {
            const userId = localStorage.getItem("userId");
            if (userId) {
                lawyerId = parseInt(userId);
            }
        }

        if (!lawyerId) {
            setLoading(false);
            console.error("Cannot fetch analytics: Profile ID is missing");
            console.error("Profile:", profile);
            console.error("localStorage userId:", localStorage.getItem("userId"));
            toast.error("Profile ID is missing. Please refresh the page.");
            return;
        }

        try {
            setLoading(true);
            console.log("Fetching analytics for lawyer ID:", lawyerId);
            const response = await axios.get(`${API_BASE_URL}/lawyers/${lawyerId}/analytics`);
            console.log("Analytics data received:", response.data);
            setData(response.data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            console.error("Error details:", error.response?.data || error.message);
            console.error("Error status:", error.response?.status);
            toast.error(`Failed to load analytics data: ${error.response?.data?.message || error.message || 'Unknown error'}`);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchLawyersList = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/lawyers/list`, {
                params: {
                    specialization: profile?.specialization || null,
                    city: profile?.city || null
                }
            });
            // Filter out current lawyer from the list
            const filtered = response.data.filter(l => l.id !== profile?.id);
            setLawyersList(filtered);
        } catch (error) {
            console.error("Error fetching lawyers list:", error);
        }
    };

    const fetchComparisonData = async () => {
        if (!comparisonLawyer?.id) return;
        try {
            setLoadingComparison(true);
            const response = await axios.get(`${API_BASE_URL}/lawyers/${comparisonLawyer.id}/analytics`);
            setComparisonData(response.data);
        } catch (error) {
            console.error("Error fetching comparison data:", error);
            toast.error("Failed to load comparison data.");
            setComparisonData(null);
        } finally {
            setLoadingComparison(false);
        }
    };

    const handleComparisonToggle = () => {
        setComparisonMode(!comparisonMode);
        if (comparisonMode) {
            setComparisonLawyer(null);
            setComparisonData(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading analytics data...</p>
                </div>
            </div>
        );
    }

    // Check for profile ID in both profile and localStorage
    const lawyerId = profile?.id || parseInt(localStorage.getItem("userId"));
    if (!lawyerId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl max-w-md">
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">Profile Not Found</h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">Unable to load profile information. Please refresh the page or log in again.</p>
                    <button
                        onClick={() => {
                            const userId = localStorage.getItem("userId");
                            if (userId) {
                                setProfile(prev => ({ ...prev, id: parseInt(userId) }));
                                fetchAnalytics();
                            } else {
                                window.location.reload();
                            }
                        }}
                        className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#b5952f] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">Failed to Load Data</h3>
                    <p className="text-red-700 dark:text-red-300 mb-4">Unable to fetch analytics data. Please check your connection and try again.</p>
                    <button
                        onClick={fetchAnalytics}
                        className="px-4 py-2 bg-[#D4AF37] text-white rounded-lg hover:bg-[#b5952f] transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Process Chart Data
    const monthlyData = Object.keys(data.monthlyTotal).map(month => ({
        name: month,
        Total: data.monthlyTotal[month],
        Confirmed: data.monthlyConfirmed[month],
        Pending: data.monthlyPending?.[month] || 0,
        Rejected: data.monthlyRejected?.[month] || 0
    }));

    const pieData = Object.keys(data.appointmentTypeBreakdown).map(type => ({
        name: type,
        value: data.appointmentTypeBreakdown[type]
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    const handleViewCalendar = () => {
        const event = new CustomEvent('navigateDashboard', {
            detail: { page: 'appointments' }
        });
        window.dispatchEvent(event);
    };

    const handleViewMessages = () => {
        const event = new CustomEvent('navigateDashboard', {
            detail: { page: 'messages' }
        });
        window.dispatchEvent(event);
    };

    // Process Comparison Chart Data
    const comparisonMonthlyData = comparisonData ? Object.keys(data.monthlyTotal).map(month => {
        const currentData = data.monthlyTotal[month] || 0;
        const compareData = comparisonData.monthlyTotal[month] || 0;
        return {
            name: month,
            'You': currentData,
            'Competitor': compareData,
            'You Confirmed': data.monthlyConfirmed[month] || 0,
            'Competitor Confirmed': comparisonData.monthlyConfirmed[month] || 0,
        };
    }) : [];

    // Radar chart data for comprehensive comparison
    const radarData = comparisonData ? [
        { subject: 'Total Apps', You: Math.min(data.allTimeAppointments / 100, 100), Competitor: Math.min(comparisonData.allTimeAppointments / 100, 100), fullMark: 100 },
        { subject: 'Conf Rate', You: data.confirmationRate, Competitor: comparisonData.confirmationRate, fullMark: 100 },
        { subject: 'Confirmed', You: Math.min((data.allTimeConfirmedAppointments / data.allTimeAppointments) * 100 || 0, 100), Competitor: Math.min((comparisonData.allTimeConfirmedAppointments / comparisonData.allTimeAppointments) * 100 || 0, 100), fullMark: 100 },
        { subject: 'This Month', You: data.totalAppointments, Competitor: comparisonData.totalAppointments, fullMark: Math.max(data.totalAppointments, comparisonData.totalAppointments, 50) },
    ] : [];

    return (
        <div className="space-y-6 animate-fade-in p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                    {comparisonMode ? 'Lawyer Comparison Dashboard' : 'Lawyer Analytics Dashboard'}
                </h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleComparisonToggle}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            comparisonMode
                                ? 'bg-[#D4AF37] text-white hover:bg-[#b5952f]'
                                : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#222]'
                        } shadow-sm`}
                    >
                        {comparisonMode ? 'Exit Comparison' : 'Compare with Competitor'}
                    </button>
                    {comparisonMode && (
                        <select
                            value={comparisonLawyer?.id || ''}
                            onChange={(e) => {
                                const selected = lawyersList.find(l => l.id === parseInt(e.target.value));
                                setComparisonLawyer(selected || null);
                            }}
                            className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                        >
                            <option value="">Select a lawyer to compare...</option>
                            {lawyersList.map((lawyer) => (
                                <option key={lawyer.id} value={lawyer.id}>
                                    {lawyer.fullName} - {lawyer.specialization} ({lawyer.city})
                                </option>
                            ))}
                        </select>
                    )}
                    {!comparisonMode && (
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                            Overview
                        </div>
                    )}
                </div>
            </div>

            {comparisonMode && comparisonLawyer && (
                <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#6B9080]/10 border-2 border-[#D4AF37]/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Comparing With:</h3>
                                <div className="flex items-center gap-6">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Competitor</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                                            {comparisonLawyer.fullName}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            {comparisonLawyer.specialization} • {comparisonLawyer.city}, {comparisonLawyer.state}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Experience</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-white">
                                            {comparisonLawyer.experienceYears} years
                                        </p>
                                    </div>
                                    {comparisonLawyer.verificationStatus && (
                                        <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {loadingComparison && (
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#D4AF37]"></div>
                        )}
                    </div>
                </div>
            )}

            {/* Top Cards */}
            {comparisonMode && comparisonData ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Appointments Comparison */}
                    <div className="bg-[#6B9080] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">Total Appointments (All-Time)</span>
                            </div>
                            <div className="text-4xl font-bold mb-2">{data.allTimeAppointments}</div>
                            <div className="text-sm mb-3 opacity-75">vs {comparisonData.allTimeAppointments}</div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((data.allTimeAppointments / Math.max(data.allTimeAppointments, comparisonData.allTimeAppointments, 1)) * 100, 100)}%` }}></div>
                            </div>
                            <div className="text-xs mt-2 opacity-75">
                                {data.allTimeAppointments >= comparisonData.allTimeAppointments ? '✓ Leading' : '→ Behind'}
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Rate Comparison */}
                    <div className="bg-[#4A7C59] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">Confirmation Rate</span>
                            </div>
                            <div className="text-4xl font-bold mb-2">{data.confirmationRate.toFixed(1)}%</div>
                            <div className="text-sm mb-3 opacity-75">vs {comparisonData.confirmationRate.toFixed(1)}%</div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: `${data.confirmationRate}%` }}></div>
                            </div>
                            <div className="text-xs mt-2 opacity-75">
                                {data.confirmationRate >= comparisonData.confirmationRate ? '✓ Leading' : '→ Behind'}
                            </div>
                        </div>
                    </div>

                    {/* This Month Comparison */}
                    <div className="bg-[#E9C46A] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">This Month</span>
                            </div>
                            <div className="text-4xl font-bold mb-2">{data.totalAppointments}</div>
                            <div className="text-sm mb-3 opacity-75">vs {comparisonData.totalAppointments}</div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((data.totalAppointments / Math.max(data.totalAppointments, comparisonData.totalAppointments, 1)) * 100, 100)}%` }}></div>
                            </div>
                            <div className="text-xs mt-2 opacity-75">
                                {data.totalAppointments >= comparisonData.totalAppointments ? '✓ Leading' : '→ Behind'}
                            </div>
                        </div>
                    </div>

                    {/* Confirmed Appointments Comparison */}
                    <div className="bg-[#D4AF37] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">Confirmed (All-Time)</span>
                            </div>
                            <div className="text-4xl font-bold mb-2">{data.allTimeConfirmedAppointments}</div>
                            <div className="text-sm mb-3 opacity-75">vs {comparisonData.allTimeConfirmedAppointments}</div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((data.allTimeConfirmedAppointments / Math.max(data.allTimeConfirmedAppointments, comparisonData.allTimeConfirmedAppointments, 1)) * 100, 100)}%` }}></div>
                            </div>
                            <div className="text-xs mt-2 opacity-75">
                                {data.allTimeConfirmedAppointments >= comparisonData.allTimeConfirmedAppointments ? '✓ Leading' : '→ Behind'}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Total Appointments Card */}
                    <div className="bg-[#6B9080] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">Total Appointments</span>
                            </div>
                            <div className="text-4xl font-bold mb-4">{data.totalAppointments}</div>
                            <div className="text-xs opacity-75">
                                This Month: {data.monthlyTotal[currentMonth] || 0}
                            </div>
                        </div>
                    </div>

                    {/* Confirmed Appointments Card */}
                    <div className="bg-[#4A7C59] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">Confirmed</span>
                            </div>
                            <div className="text-4xl font-bold mb-4">{data.confirmedAppointments}</div>
                            <div className="text-xs opacity-75">
                                This Month: {data.monthlyConfirmed[currentMonth] || 0}
                            </div>
                        </div>
                    </div>

                    {/* Pending Appointments Card */}
                    <div className="bg-[#E9C46A] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">Pending</span>
                            </div>
                            <div className="text-4xl font-bold mb-4">{data.pendingAppointments}</div>
                            <div className="text-xs opacity-75">
                                This Month: {data.monthlyPending?.[currentMonth] || 0}
                            </div>
                        </div>
                    </div>

                    {/* Rejected Appointments Card */}
                    <div className="bg-red-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2 opacity-90">
                                <span className="font-medium">Rejected</span>
                            </div>
                            <div className="text-4xl font-bold mb-4">{data.rejectedAppointments || 0}</div>
                            <div className="text-xs opacity-75">
                                This Month: {data.monthlyRejected?.[currentMonth] || 0}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Confirmation Rate Small Card */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col justify-center items-center">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2">Overall Performance</h3>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-[#D4AF37] mb-1">{data.confirmationRate.toFixed(1)}%</div>
                        <div className="text-xs text-green-500 font-bold uppercase tracking-wider">Confirmation Rate</div>
                    </div>
                    <div className="mt-6 w-full bg-gray-100 dark:bg-[#333] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${data.confirmationRate}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            {comparisonMode && comparisonData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Trends Comparison */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col h-96">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Trends Comparison (Last 6 Months)</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={comparisonMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }}
                                        cursor={{ opacity: 0.1 }}
                                    />
                                    <Legend />
                                    <Bar dataKey="You" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Competitor" fill="#6B9080" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Confirmed Appointments Comparison */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col h-96">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Confirmed Appointments Trend</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={comparisonMonthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }}
                                        cursor={{ opacity: 0.1 }}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="You Confirmed" stroke="#D4AF37" strokeWidth={3} dot={{ r: 5 }} />
                                    <Line type="monotone" dataKey="Competitor Confirmed" stroke="#6B9080" strokeWidth={3} dot={{ r: 5 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Radar Chart for Comprehensive Comparison */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col h-96">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Performance Radar Comparison</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData}>
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" stroke="#888888" />
                                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#888888" />
                                    <Radar name="You" dataKey="You" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.6} />
                                    <Radar name="Competitor" dataKey="Competitor" stroke="#6B9080" fill="#6B9080" fillOpacity={0.6} />
                                    <Legend />
                                    <Tooltip />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Key Metrics Side-by-Side Comparison */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Detailed Metrics Comparison</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-[#D4AF37] text-sm uppercase tracking-wide">Your Metrics</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">All-Time Total</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{data.allTimeAppointments}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{data.allTimeConfirmedAppointments}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{data.allTimePendingAppointments}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Confirmation Rate</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{data.confirmationRate.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-semibold text-[#6B9080] text-sm uppercase tracking-wide">Competitor Metrics</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">All-Time Total</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{comparisonData.allTimeAppointments}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Confirmed</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{comparisonData.allTimeConfirmedAppointments}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{comparisonData.allTimePendingAppointments}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-[#222] rounded-lg">
                                        <span className="text-sm text-gray-600 dark:text-gray-400">Confirmation Rate</span>
                                        <span className="font-bold text-gray-900 dark:text-white">{comparisonData.confirmationRate.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
                    {/* Pie Chart */}
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Appointment Breakdown</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Composed Chart (Bar + Line) */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Monthly Trends (Last 6 Months)</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }}
                                        cursor={{ opacity: 0.1 }}
                                    />
                                    <Legend />
                                    <Bar dataKey="Total" fill="#5B9BD5" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Pending" fill="#E9C46A" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="Rejected" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Line type="monotone" dataKey="Confirmed" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#D4AF37' }} activeDot={{ r: 6 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Section: Upcoming Appointments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] shadow-lg overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-[#333] flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Appointments</h3>
                        <button
                            onClick={handleViewCalendar}
                            className="text-sm text-[#D4AF37] font-medium hover:underline"
                        >
                            View Calendar
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                            <thead className="bg-gray-50 dark:bg-[#222] text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Time</th>
                                    <th className="px-6 py-4">Client</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-[#333]">
                                {data.upcomingAppointments.length > 0 ? (
                                    data.upcomingAppointments.map((appt) => (
                                        <tr key={appt.id} className="hover:bg-gray-50 dark:hover:bg-[#222]/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{appt.date}</td>
                                            <td className="px-6 py-4">{appt.time}</td>
                                            <td className="px-6 py-4">{appt.clientName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                        appt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                    {appt.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setSelectedAppointment(appt)}
                                                    className="bg-[#D4AF37] hover:bg-[#b5952f] text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                            No upcoming appointments found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Client Interaction Stats / Notifications Placeholder */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#333] shadow-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-200 dark:border-[#333] flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Client Interactions</h3>
                        <button
                            onClick={handleViewMessages}
                            className="text-sm text-[#D4AF37] font-medium hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        {data.recentInteractions && data.recentInteractions.length > 0 ? (
                            <div className="divide-y divide-gray-100 dark:divide-[#333]">
                                {data.recentInteractions.map((interaction) => (
                                    <div key={interaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-[#222] transition-colors flex items-start gap-3 cursor-pointer" onClick={handleViewMessages}>
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#333] flex items-center justify-center text-[#D4AF37] font-bold shrink-0">
                                            {interaction.clientName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{interaction.clientName}</h4>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{interaction.timestamp}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{interaction.lastMessage}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 flex flex-col justify-center items-center text-center text-gray-500 h-full">
                                <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                <p className="text-sm">Recent client messages and calls will appear here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedAppointment && (
                <ViewAppointmentModal
                    appointment={selectedAppointment}
                    onClose={() => setSelectedAppointment(null)}
                />
            )}
        </div>
    );
}

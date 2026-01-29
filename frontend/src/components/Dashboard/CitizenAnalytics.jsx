import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Line, ComposedChart
} from 'recharts';
import { toast } from 'react-toastify';
import axios from 'axios';
import { getMyCases } from '../../api/caseApi';
import { FiCheckCircle, FiFileText, FiCalendar, FiMapPin } from 'react-icons/fi';

// API Configuration
const API_BASE_URL = "http://localhost:8080/api";

export default function CitizenAnalytics({ profile }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedCases, setCompletedCases] = useState([]);

    useEffect(() => {
        // Get citizen ID from profile or localStorage
        let citizenId = profile?.id;
        if (!citizenId) {
            const userId = localStorage.getItem("userId");
            if (userId) {
                citizenId = parseInt(userId);
            }
        }

        if (citizenId) {
            fetchAnalytics();
            fetchCompletedCases();
        } else {
            setLoading(false);
            console.warn("Profile ID not available:", profile);
        }
    }, [profile]);

    const fetchCompletedCases = async () => {
        try {
            const res = await getMyCases();
            const cases = res.data || [];
            // Filter for completed/resolved cases
            const completed = cases.filter(c => 
                c.status === 'COMPLETED' || 
                c.status === 'RESOLVED' || 
                c.status === 'CLOSED'
            );
            setCompletedCases(completed);
        } catch (error) {
            console.error("Error fetching completed cases:", error);
        }
    };

    const fetchAnalytics = async () => {
        // Get citizen ID from profile or localStorage
        let citizenId = profile?.id;
        if (!citizenId) {
            const userId = localStorage.getItem("userId");
            if (userId) {
                citizenId = parseInt(userId);
            }
        }

        if (!citizenId) {
            setLoading(false);
            console.error("Cannot fetch analytics: Profile ID is missing");
            toast.error("Profile ID is missing. Please refresh the page.");
            return;
        }

        try {
            setLoading(true);
            console.log("Fetching analytics for citizen ID:", citizenId);
            const response = await axios.get(`${API_BASE_URL}/citizens/${citizenId}/analytics`);
            console.log("Analytics data received:", response.data);
            setData(response.data);
        } catch (error) {
            console.error("Error fetching analytics:", error);
            console.error("Error details:", error.response?.data || error.message);
            toast.error(`Failed to load analytics data: ${error.response?.data?.error || error.message || 'Unknown error'}`);
            setData(null);
        } finally {
            setLoading(false);
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
    const citizenId = profile?.id || parseInt(localStorage.getItem("userId"));
    if (!citizenId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl max-w-md">
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">Profile Not Found</h3>
                    <p className="text-yellow-700 dark:text-yellow-300 mb-4">Unable to load profile information. Please refresh the page or log in again.</p>
                    <button
                        onClick={() => window.location.reload()}
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
    const monthlyCasesData = Object.keys(data.monthlyCases || {}).map(month => ({
        name: month,
        Cases: data.monthlyCases[month] || 0,
    }));

    const monthlyAppointmentsData = Object.keys(data.monthlyAppointments || {}).map(month => ({
        name: month,
        Total: data.monthlyAppointments[month] || 0,
        Confirmed: data.monthlyConfirmedAppointments?.[month] || 0,
    }));

    const casesByStatusData = Object.keys(data.casesByStatus || {}).map(status => ({
        name: status,
        value: data.casesByStatus[status] || 0,
    }));

    const appointmentsByStatusData = Object.keys(data.appointmentsByStatus || {}).map(status => ({
        name: status,
        value: data.appointmentsByStatus[status] || 0,
    }));

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82CA9D'];
    const CASES_COLORS = ['#6B9080', '#4A7C59', '#E9C46A', '#D4AF37'];
    const APPOINTMENTS_COLORS = ['#4A7C59', '#E9C46A', '#EF4444', '#6B9080'];

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });

    const handleViewCases = () => {
        const event = new CustomEvent('navigateDashboard', {
            detail: { page: 'cases' }
        });
        window.dispatchEvent(event);
    };

    const handleViewAppointments = () => {
        const event = new CustomEvent('navigateDashboard', {
            detail: { page: 'appointments' }
        });
        window.dispatchEvent(event);
    };

    return (
        <div className="space-y-6 animate-fade-in p-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">My Analytics Dashboard</h2>
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333] rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm">
                    Overview
                </div>
            </div>

            {/* Top Cards - Cases */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Total Cases Card */}
                <div className="bg-[#6B9080] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <span className="font-medium">Total Cases</span>
                        </div>
                        <div className="text-4xl font-bold mb-4">{data.totalCases || 0}</div>
                        <div className="text-xs opacity-75">
                            This Month: {data.thisMonthCases || 0}
                        </div>
                    </div>
                </div>

                {/* Submitted Cases Card */}
                <div className="bg-[#4A7C59] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <span className="font-medium">Submitted Cases</span>
                        </div>
                        <div className="text-4xl font-bold mb-4">{data.submittedCases || 0}</div>
                        <div className="text-xs opacity-75">
                            Draft Cases: {data.draftCases || 0}
                        </div>
                    </div>
                </div>

                {/* Total Appointments Card */}
                <div className="bg-[#D4AF37] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <span className="font-medium">Total Appointments</span>
                        </div>
                        <div className="text-4xl font-bold mb-4">{data.totalAppointments || 0}</div>
                        <div className="text-xs opacity-75">
                            This Month: {data.thisMonthAppointments || 0}
                        </div>
                    </div>
                </div>

                {/* Confirmed Appointments Card */}
                <div className="bg-[#E9C46A] rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2 opacity-90">
                            <span className="font-medium">Confirmed Appointments</span>
                        </div>
                        <div className="text-4xl font-bold mb-4">{data.confirmedAppointments || 0}</div>
                        <div className="text-xs opacity-75">
                            Confirmation Rate: {data.confirmationRate?.toFixed(1) || 0}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col justify-center items-center">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2">Appointment Success</h3>
                    <div className="text-center">
                        <div className="text-4xl font-bold text-[#D4AF37] mb-1">{data.confirmationRate?.toFixed(1) || 0}%</div>
                        <div className="text-xs text-green-500 font-bold uppercase tracking-wider">Confirmation Rate</div>
                    </div>
                    <div className="mt-6 w-full bg-gray-100 dark:bg-[#333] rounded-full h-2 overflow-hidden">
                        <div className="bg-[#D4AF37] h-full rounded-full" style={{ width: `${data.confirmationRate || 0}%` }}></div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col justify-center items-center">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2">Pending Appointments</h3>
                    <div className="text-4xl font-bold text-[#E9C46A] mb-1">{data.pendingAppointments || 0}</div>
                    <button
                        onClick={handleViewAppointments}
                        className="mt-4 text-sm text-[#D4AF37] font-medium hover:underline"
                    >
                        View Appointments →
                    </button>
                </div>

                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col justify-center items-center">
                    <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-2">My Cases</h3>
                    <div className="text-4xl font-bold text-[#6B9080] mb-1">{data.totalCases || 0}</div>
                    <button
                        onClick={handleViewCases}
                        className="mt-4 text-sm text-[#D4AF37] font-medium hover:underline"
                    >
                        View Cases →
                    </button>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                {/* Cases by Status Pie Chart */}
                {casesByStatusData.length > 0 && (
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cases by Status</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={casesByStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {casesByStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CASES_COLORS[index % CASES_COLORS.length]} />
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
                )}

                {/* Appointments by Status Pie Chart */}
                {appointmentsByStatusData.length > 0 && (
                    <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Appointments by Status</h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={appointmentsByStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {appointmentsByStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={APPOINTMENTS_COLORS[index % APPOINTMENTS_COLORS.length]} />
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
                )}
            </div>

            {/* Monthly Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-96">
                {/* Monthly Cases Trend */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cases Trend (Last 6 Months)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyCasesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }}
                                    cursor={{ opacity: 0.1 }}
                                />
                                <Legend />
                                <Bar dataKey="Cases" fill="#6B9080" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Monthly Appointments Trend */}
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-6 border border-gray-200 dark:border-[#333] shadow-lg flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Appointments Trend (Last 6 Months)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={monthlyAppointmentsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#333', borderColor: '#333', color: '#fff' }}
                                    cursor={{ opacity: 0.1 }}
                                />
                                <Legend />
                                <Bar dataKey="Total" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="Confirmed" stroke="#4A7C59" strokeWidth={3} dot={{ r: 4, fill: '#4A7C59' }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Completed Cases Section */}
            {completedCases.length > 0 && (
                <div className="mt-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <FiCheckCircle className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Completed Cases</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{completedCases.length} case(s) successfully resolved</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedCases.map((caseItem) => (
                            <div 
                                key={caseItem.id} 
                                className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:border-green-400 dark:hover:border-green-600"
                            >
                                {/* Success Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <FiCheckCircle className="w-3 h-3" />
                                        COMPLETED
                                    </span>
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                        #{caseItem.id}
                                    </span>
                                </div>

                                {/* Case Title */}
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1">
                                    {caseItem.caseTitle || caseItem.title || "Untitled Case"}
                                </h4>

                                {/* Case Details */}
                                <div className="space-y-2 mb-3">
                                    {caseItem.caseType && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <FiFileText className="w-4 h-4 text-green-500" />
                                            <span className="font-medium">{caseItem.caseType}</span>
                                        </div>
                                    )}
                                    {caseItem.incidentPlace && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <FiMapPin className="w-4 h-4 text-green-500" />
                                            <span className="truncate">{caseItem.incidentPlace}</span>
                                        </div>
                                    )}
                                    {(caseItem.createdAt || caseItem.submittedAt) && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                            <FiCalendar className="w-4 h-4 text-green-500" />
                                            <span>
                                                {new Date(caseItem.createdAt || caseItem.submittedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Description Preview */}
                                {caseItem.description && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                        {caseItem.description}
                                    </p>
                                )}

                                {/* Success Message */}
                                <div className="pt-3 border-t border-green-200 dark:border-green-800">
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Successfully Resolved
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Completed Cases Message */}
            {completedCases.length === 0 && (
                <div className="mt-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl p-8 border border-gray-200 dark:border-[#333] text-center">
                    <FiCheckCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400 mb-2">No Completed Cases Yet</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Your completed cases will appear here once they are resolved.</p>
                </div>
            )}
        </div>
    );
}

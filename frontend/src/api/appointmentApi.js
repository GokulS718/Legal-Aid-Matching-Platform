import axiosClient from "./axiosClient";

// Schedule an appointment
export const scheduleAppointment = async (appointmentData) => {
    // appointmentData: { providerId, providerRole, startTime, endTime, type, description, caseId?, caseTitle?, caseSummary? }
    return axiosClient.post("/appointments", appointmentData);
};

// Get my appointments
export const getMyAppointments = async () => {
    return axiosClient.get("/appointments");
};

// Update status (Approve/Reject)
export const updateAppointmentStatus = async (id, status) => {
    return axiosClient.put(`/appointments/${id}/status`, { status });
};

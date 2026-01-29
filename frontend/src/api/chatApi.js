import axiosClient from "./axiosClient";

// Create or get existing session
export const createSession = async (caseId, providerId, providerRole) => {
    return axiosClient.post("/chat/sessions", { caseId, providerId, providerRole });
};

// Get all sessions for user
export const getMySessions = async () => {
    return axiosClient.get("/chat/my-sessions");
};

// Get messages for a session
export const getMessages = async (sessionId) => {
    return axiosClient.get(`/chat/sessions/${sessionId}/messages`);
};

// Upload attachment
export const uploadAttachment = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await axiosClient.post("/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data; // { url: "..." }
};

// Mark messages as read
export const markMessagesRead = async (sessionId) => {
    return axiosClient.patch(`/chat/sessions/${sessionId}/read`);
};

// Delete message
export const deleteMessage = async (messageId) => {
    return axiosClient.delete(`/chat/messages/${messageId}`);
};

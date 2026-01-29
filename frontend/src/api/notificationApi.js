import axiosClient from "./axiosClient";

// Get all notifications
export const getNotifications = async () => {
    return axiosClient.get("/notifications", {
        _silent: true // Mark as silent to prevent error logging
    });
};

// Get unread count
export const getUnreadCount = async () => {
    return axiosClient.get("/notifications/unread-count", {
        _silent: true // Mark as silent to prevent error logging
    });
};

// Mark as read
export const markAsRead = async (id) => {
    return axiosClient.put(`/notifications/${id}/read`);
};

// Delete notification
export const deleteNotification = async (id) => {
    return axiosClient.delete(`/notifications/${id}`);
};

// Mark all as read
export const markAllNotificationsAsRead = async () => {
    return axiosClient.put("/notifications/read-all");
};

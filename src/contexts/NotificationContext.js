"use client";
import { createContext, useContext, useState, useCallback } from "react";
import FlashNotification from "@/components/ui/FlashNotification";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-suppression après la durée
    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    addNotification(message, "success", duration);
  }, [addNotification]);

  const showError = useCallback((message, duration) => {
    addNotification(message, "error", duration);
  }, [addNotification]);

  const showWarning = useCallback((message, duration) => {
    addNotification(message, "warning", duration);
  }, [addNotification]);

  const showInfo = useCallback((message, duration) => {
    addNotification(message, "info", duration);
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeNotification
    }}>
      {children}
      {notifications.map(notification => (
        <FlashNotification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}

import { useState, useEffect } from "react";

interface ToastNotificationProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
}

export function ToastNotification({ message, isVisible, onHide }: ToastNotificationProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  return (
    <div 
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <p>{message}</p>
    </div>
  );
}

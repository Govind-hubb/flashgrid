import React from 'react';
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const Toast = () => {
  const { toastMessage } = useSeats();

  if (!toastMessage) return null;

  const { msg, type } = toastMessage;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} color="#34d399" />;
      case 'warning':
        return <AlertTriangle size={16} color="#fbbf24" />;
      case 'error':
        return <XCircle size={16} color="#f87171" />;
      default:
        return <Info size={16} color="#38bdf8" />;
    }
  };

  return (
    <div className={`toast-notification ${type} animate-fade-in`}>
      {getIcon()}
      <span>{msg}</span>
    </div>
  );
};

import React from 'react';
import { Users, CheckCircle2, Clock, Lock, ShieldCheck } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const TelemetryBar = () => {
  const { metrics, myHeldSeats } = useSeats();

  return (
    <div className="telemetry-ribbon">
      {/* Active Users */}
      <div className="telemetry-card">
        <div className="telemetry-icon-wrap" style={{ background: '#f6f6f3', color: '#000000' }}>
          <Users size={18} />
        </div>
        <div className="telemetry-info">
          <span className="telemetry-label">Active Users</span>
          <span className="telemetry-value">{metrics.activeUsers.toLocaleString()}</span>
        </div>
      </div>

      {/* Available Seats */}
      <div className="telemetry-card">
        <div className="telemetry-icon-wrap" style={{ background: '#ecfdf5', color: '#10b981' }}>
          <CheckCircle2 size={18} />
        </div>
        <div className="telemetry-info">
          <span className="telemetry-label">Available</span>
          <span className="telemetry-value" style={{ color: '#059669' }}>{metrics.available}</span>
        </div>
      </div>

      {/* My Held Seats */}
      <div className="telemetry-card">
        <div className="telemetry-icon-wrap" style={{ background: '#fef2f2', color: '#e60023' }}>
          <Clock size={18} />
        </div>
        <div className="telemetry-info">
          <span className="telemetry-label">My Reserved</span>
          <span className="telemetry-value" style={{ color: '#e60023' }}>{myHeldSeats.length}</span>
        </div>
      </div>

      {/* Held by Others */}
      <div className="telemetry-card">
        <div className="telemetry-icon-wrap" style={{ background: '#f6f6f3', color: '#62625b' }}>
          <Lock size={18} />
        </div>
        <div className="telemetry-info">
          <span className="telemetry-label">Locked / Held</span>
          <span className="telemetry-value" style={{ color: '#262622' }}>{metrics.held}</span>
        </div>
      </div>

      {/* Engine Status */}
      <div className="telemetry-card">
        <div className="telemetry-icon-wrap" style={{ background: '#f6f6f3', color: '#000000' }}>
          <ShieldCheck size={18} />
        </div>
        <div className="telemetry-info">
          <span className="telemetry-label">Concurrency Model</span>
          <span className="telemetry-value" style={{ fontSize: '0.9rem' }}>REDIS SET NX</span>
        </div>
      </div>
    </div>
  );
};

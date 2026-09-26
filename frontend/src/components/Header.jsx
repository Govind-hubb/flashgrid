import React from 'react';
import { Zap, Radio, ShoppingBag, Terminal, Sparkles } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const Header = () => {
  const { myHeldSeats, setIsDrawerOpen, isFeedOpen, setIsFeedOpen, metrics } = useSeats();

  return (
    <header className="header-wrapper">
      <div className="header-top">
        {/* Brand & Project Title */}
        <div className="brand-section">
          <div className="brand-icon-box">
            <Zap size={22} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-title">
              FlashGrid
              <span className="brand-tag">Distributed Engine</span>
            </div>
            <div className="event-sub">
              <span>High-Concurrency Flash-Sale & Seat Reservation Platform</span>
            </div>
          </div>
        </div>

        {/* Concert / Event Info */}
        <div className="event-details">
          <div className="event-title">Coldplay: Music of the Spheres Tour</div>
          <div className="event-sub">
            <span>🏟️ Grand Arena Stadium</span>
            <span>•</span>
            <span>📅 Saturday, 8:00 PM</span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="header-actions">
          {/* WebSocket Latency Pill */}
          <div className="status-pill connected">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span>WS: {metrics.p99Latency}ms</span>
          </div>

          {/* Audit Logs Toggle */}
          <button 
            className={`status-pill ${isFeedOpen ? 'simulated' : ''}`}
            onClick={() => setIsFeedOpen(!isFeedOpen)}
            title="View Live Redis Lock & WebSocket Stream"
          >
            <Terminal size={14} />
            <span>Audit Feed</span>
          </button>

          {/* Sticky Red CTA Cart / Hold Button */}
          <button 
            className="view-cart-btn"
            onClick={() => setIsDrawerOpen(true)}
          >
            <ShoppingBag size={16} />
            <span>Reserved</span>
            <span className="cart-badge">{myHeldSeats.length}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

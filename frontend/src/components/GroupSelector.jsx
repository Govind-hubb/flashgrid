import React from 'react';
import { Users, Sparkles, Trash2, ShoppingBag } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const GroupSelector = () => {
  const {
    myHeldSeats,
    seats,
    quickSelectAdjacent,
    releaseAllSeats,
    setIsDrawerOpen,
  } = useSeats();

  const heldList = myHeldSeats.map((id) => seats[id]).filter(Boolean);
  const totalHeldPrice = heldList.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="group-selector-card">
      <div className="group-selector-left">
        <div className="group-title">
          <Sparkles size={16} color="#e60023" />
          <span>Quick Group Booking:</span>
        </div>
        <div className="group-buttons">
          {[2, 3, 4, 6].map((num) => (
            <button
              key={num}
              className={`group-chip-btn ${myHeldSeats.length === num ? 'active' : ''}`}
              onClick={() => quickSelectAdjacent(num)}
              title={`Find and atomically lock ${num} contiguous adjacent seats`}
            >
              <Users size={13} />
              <span>{num} Seats</span>
            </button>
          ))}
        </div>
      </div>

      {myHeldSeats.length > 0 && (
        <div className="group-selector-right animate-fade-in">
          <div className="group-summary-text">
            <span style={{ fontWeight: 700, color: '#e60023' }}>{myHeldSeats.length} seats reserved</span>
            <span style={{ color: 'var(--color-mute)' }}>•</span>
            <span style={{ fontWeight: 800, color: 'var(--color-ink)' }}>
              ${totalHeldPrice}
            </span>
          </div>

          <button
            className="clear-selection-btn"
            onClick={releaseAllSeats}
            title="Release all currently held seats"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>

          <button
            className="checkout-shortcut-btn"
            onClick={() => setIsDrawerOpen(true)}
          >
            <ShoppingBag size={14} />
            <span>Checkout</span>
          </button>
        </div>
      )}
    </div>
  );
};

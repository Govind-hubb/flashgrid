import React from 'react';
import { Lock, Clock } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const Seat = ({ seat }) => {
  const { holdSeat, holdTimeLeft } = useSeats();
  const { id, row, number, status, price, tier, heldBy } = seat;

  const handleClick = () => {
    holdSeat(id);
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const getTooltipText = () => {
    if (status === 'held_by_me') return `Seat ${id} (${tier}) - Held by You (${formatTimer(holdTimeLeft)}) - Click to release`;
    if (status === 'held_by_other') return `Seat ${id} (${tier}) - Locked by ${heldBy || 'another user'} (Redis Lock Active)`;
    if (status === 'booked') return `Seat ${id} (${tier}) - Sold Out`;
    return `Seat ${id} • ${tier} • $${price} • Click to Reserve (10-min hold)`;
  };

  return (
    <button
      className={`seat-btn ${status}`}
      onClick={handleClick}
      disabled={status === 'booked' || status === 'held_by_other'}
      title={getTooltipText()}
      aria-label={`Seat ${id}, ${status}`}
    >
      {/* If held by other -> Lock Icon */}
      {status === 'held_by_other' && (
        <span className="seat-icon-badge">
          <Lock size={12} />
        </span>
      )}

      {/* If booked -> Disabled Dot */}
      {status === 'booked' && (
        <span style={{ fontSize: '0.6rem' }}>✕</span>
      )}

      {/* If available or held by me -> Seat Number */}
      {(status === 'available' || status === 'held_by_me') && (
        <span>{number}</span>
      )}

      {/* If held by me -> Tiny countdown badge on the seat */}
      {status === 'held_by_me' && (
        <span className="seat-timer-badge">
          {formatTimer(holdTimeLeft)}
        </span>
      )}
    </button>
  );
};

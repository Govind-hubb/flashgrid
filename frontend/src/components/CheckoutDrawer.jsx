import React from 'react';
import { X, Clock, Trash2, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const CheckoutDrawer = () => {
  const {
    myHeldSeats,
    seats,
    holdTimeLeft,
    isDrawerOpen,
    setIsDrawerOpen,
    releaseSeat,
    releaseAllSeats,
    confirmBooking,
  } = useSeats();

  if (!isDrawerOpen) return null;

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const heldSeatsData = myHeldSeats.map((id) => seats[id]).filter(Boolean);
  const subtotal = heldSeatsData.reduce((acc, s) => acc + s.price, 0);
  const taxes = Math.round(subtotal * 0.18);
  const bookingFee = myHeldSeats.length > 0 ? 15 : 0;
  const total = subtotal + taxes + bookingFee;
  const simulatedIdempotencyKey = `idemp_batch_${myHeldSeats.length}seats_${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
      <div className="checkout-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-title">
            <Ticket size={20} color="#10b981" />
            <span>Multi-Seat Checkout ({myHeldSeats.length})</span>
          </div>
          <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {myHeldSeats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
            <p>No seats selected yet.</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Click any available seats on the map or use the Quick Group Selector to reserve multiple seats at once!
            </p>
          </div>
        ) : (
          <>
            {/* 10-Minute Timer Banner */}
            <div className={`timer-banner ${holdTimeLeft < 60 ? 'warning' : ''}`}>
              <Clock size={24} className={holdTimeLeft < 60 ? 'animate-pulse' : ''} />
              <div className="timer-text-wrap">
                <div className="timer-label">Batch Hold Window</div>
                <div className="timer-clock">{formatTimer(holdTimeLeft)}</div>
                <div className="timer-hint">
                  {holdTimeLeft < 60
                    ? '⚠️ Auto-release imminent! Complete payment now.'
                    : `Holding ${myHeldSeats.length} seats. Locks auto-release if unpaid after 10 mins.`}
                </div>
              </div>
            </div>

            {/* Selected Seats List */}
            <div className="selected-seats-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Selected Seats ({heldSeatsData.length})
                </span>
                <button
                  style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}
                  onClick={releaseAllSeats}
                >
                  Clear All
                </button>
              </div>

              {heldSeatsData.map((seat) => (
                <div key={seat.id} className="seat-summary-card">
                  <div>
                    <div className="seat-summary-title">Seat {seat.id}</div>
                    <div className="seat-summary-tier">{seat.tier} Tier • Row {seat.row}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800 }}>${seat.price}</span>
                    <button
                      className="seat-remove-btn"
                      onClick={() => releaseSeat(seat.id)}
                      title={`Release Seat ${seat.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="price-breakdown">
              <div className="price-row">
                <span>Seats Subtotal ({heldSeatsData.length} tickets)</span>
                <span>${subtotal}</span>
              </div>
              <div className="price-row">
                <span>GST / Taxes (18%)</span>
                <span>${taxes}</span>
              </div>
              <div className="price-row">
                <span>Platform Convenience Fee</span>
                <span>${bookingFee}</span>
              </div>
              <div className="price-row total">
                <span>Total Payable</span>
                <span style={{ color: '#10b981' }}>${total}</span>
              </div>

              {/* Idempotency Key preview */}
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={12} color="#10b981" />
                  <span>Batch Idempotency Protection</span>
                </div>
                <div className="idempotency-preview">
                  X-Idempotency-Key: {simulatedIdempotencyKey}
                </div>
              </div>

              <button className="pay-btn" onClick={confirmBooking}>
                <span>Pay & Confirm All {heldSeatsData.length} Seats (${total})</span>
                <ArrowRight size={18} />
              </button>

              <button
                className="release-btn"
                onClick={() => {
                  releaseAllSeats();
                  setIsDrawerOpen(false);
                }}
              >
                Cancel & Release All Seats
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

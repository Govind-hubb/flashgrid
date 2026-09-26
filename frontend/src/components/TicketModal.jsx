import React from 'react';
import { X, CheckCircle2, Ticket, QrCode, Download, ShieldCheck } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const TicketModal = () => {
  const { confirmedTicket, setConfirmedTicket } = useSeats();

  if (!confirmedTicket) return null;

  const { bookingId, idempotencyKey, seats, totalPrice, bookedAt } = confirmedTicket;

  return (
    <div className="ticket-modal-overlay" onClick={() => setConfirmedTicket(null)}>
      <div className="ticket-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ticket-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Ticket size={24} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>COLDPLAY • WORLD TOUR</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                OFFICIAL BATCH E-TICKET PASS ({seats.length} {seats.length === 1 ? 'SEAT' : 'SEATS'})
              </div>
            </div>
          </div>
          <button className="close-btn" style={{ color: '#ffffff' }} onClick={() => setConfirmedTicket(null)}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="ticket-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399' }}>
            <CheckCircle2 size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              All {seats.length} Seats Confirmed (MongoDB ACID Session Committed)
            </span>
          </div>

          {/* Seat Pills List */}
          <div>
            <div className="ticket-field-label" style={{ marginBottom: '0.4rem' }}>
              Reserved Seat Numbers:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {seats.map((s) => (
                <span
                  key={s.id}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34d399',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  {s.id} ({s.tier} • ${s.price})
                </span>
              ))}
            </div>
          </div>

          <div className="ticket-grid">
            <div>
              <div className="ticket-field-label">Master Booking Ref</div>
              <div className="ticket-field-val" style={{ color: '#10b981' }}>#{bookingId}</div>
            </div>
            <div>
              <div className="ticket-field-label">Date & Time</div>
              <div className="ticket-field-val">Sat, Oct 24 • 8:00 PM</div>
            </div>
            <div>
              <div className="ticket-field-label">Total Seats Paid</div>
              <div className="ticket-field-val">{seats.length} Tickets</div>
            </div>
            <div>
              <div className="ticket-field-label">Total Amount Paid</div>
              <div className="ticket-field-val" style={{ color: '#10b981' }}>${totalPrice}</div>
            </div>
            <div>
              <div className="ticket-field-label">Venue & Turnstile</div>
              <div className="ticket-field-val">Grand Arena • Gate 4B</div>
            </div>
            <div>
              <div className="ticket-field-label">Commit Timestamp</div>
              <div className="ticket-field-val" style={{ fontSize: '0.78rem' }}>{bookedAt}</div>
            </div>
          </div>

          {/* Idempotency Key Verification */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} color="#34d399" />
              <span>Multi-Document Transaction Idempotency Hash</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
              {idempotencyKey}
            </div>
          </div>
        </div>

        {/* Barcode / QR Simulation */}
        <div className="ticket-barcode-wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
            <QrCode size={18} />
            <span>Multi-Admission Master QR • Scan at Turnstile</span>
          </div>
          <div style={{ letterSpacing: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            ||||| | |||| ||| |||||| |||| | ||| |||||||
          </div>
        </div>

        <button className="ticket-close-action" onClick={() => setConfirmedTicket(null)}>
          Done / Close Pass
        </button>
      </div>
    </div>
  );
};

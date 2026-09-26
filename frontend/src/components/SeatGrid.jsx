import React from 'react';
import { Seat } from './Seat';
import { useSeats } from '../context/SeatContext';

export const SeatGrid = () => {
  const { seats } = useSeats();

  const renderRow = (rowLetter) => {
    const leftSeats = [];
    const rightSeats = [];

    for (let i = 1; i <= 6; i++) {
      const id = `${rowLetter}-${i}`;
      if (seats[id]) leftSeats.push(seats[id]);
    }

    for (let i = 7; i <= 12; i++) {
      const id = `${rowLetter}-${i}`;
      if (seats[id]) rightSeats.push(seats[id]);
    }

    return (
      <div className="row-container" key={rowLetter}>
        <div className="row-label">{rowLetter}</div>
        <div className="seats-row">
          {leftSeats.map((seat) => (
            <Seat key={seat.id} seat={seat} />
          ))}
        </div>
        <div className="seats-aisle"></div>
        <div className="seats-row">
          {rightSeats.map((seat) => (
            <Seat key={seat.id} seat={seat} />
          ))}
        </div>
        <div className="row-label">{rowLetter}</div>
      </div>
    );
  };

  return (
    <div className="seating-matrix-card">
      {/* Tier 1: VIP Front Section */}
      <div className="tier-section">
        <div className="tier-header">
          <div className="tier-info">
            <span className="tier-badge vip">VIP FRONT STAGE</span>
            <span className="tier-name">Gold Soundstage Section</span>
          </div>
          <span className="tier-price">$250 / seat</span>
        </div>
        {['A', 'B', 'C'].map(renderRow)}
      </div>

      {/* Tier 2: Club Central Section */}
      <div className="tier-section">
        <div className="tier-header">
          <div className="tier-info">
            <span className="tier-badge club">CLUB TIER</span>
            <span className="tier-name">Central Arena Section</span>
          </div>
          <span className="tier-price">$150 / seat</span>
        </div>
        {['D', 'E', 'F', 'G'].map(renderRow)}
      </div>

      {/* Tier 3: Grandstand Upper Section */}
      <div className="tier-section">
        <div className="tier-header">
          <div className="tier-info">
            <span className="tier-badge grandstand">GRANDSTAND</span>
            <span className="tier-name">Upper Bowl Section</span>
          </div>
          <span className="tier-price">$80 / seat</span>
        </div>
        {['H', 'I', 'J'].map(renderRow)}
      </div>

      {/* Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot held_me"></span>
          <span>Reserved for You (10m hold)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot held_other"></span>
          <span>Locked by Other Users</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot booked"></span>
          <span>Sold Out</span>
        </div>
      </div>
    </div>
  );
};

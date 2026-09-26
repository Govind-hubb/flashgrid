import React from 'react';
import { Play, Pause, Flame, TimerReset, Activity, Terminal } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const SimulationDock = () => {
  const {
    simulateConcurrentAttack,
    handleHoldExpired,
    myHeldSeats,
    isSimulatingTraffic,
    toggleTrafficSimulation,
    runLatencyBenchmark,
    isFeedOpen,
    setIsFeedOpen,
  } = useSeats();

  return (
    <div className="sim-dock">
      {/* Title & Tag */}
      <div className="sim-left">
        <div className="sim-title-group">
          <span className="sim-tag">FAANG Concurrency Demo</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Systems Simulator
          </span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="sim-controls">
        {/* 50-Bot Attack */}
        <button
          className="sim-action-btn danger"
          onClick={() => simulateConcurrentAttack('A-1')}
          title="Fires 50 simultaneous lock requests at t=0ms to prove zero race conditions"
        >
          <Flame size={14} color="#ef4444" />
          <span>Attack Seat A-1 (50 Bots)</span>
        </button>

        {/* Live Traffic Simulator */}
        <button
          className={`sim-action-btn ${isSimulatingTraffic ? 'active' : ''}`}
          onClick={toggleTrafficSimulation}
          title="Simulate random user holds and releases in the background"
        >
          {isSimulatingTraffic ? (
            <>
              <Pause size={14} />
              <span>Pause Traffic</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Simulate 5k Users</span>
            </>
          )}
        </button>

        {/* Force Hold Expiry */}
        <button
          className="sim-action-btn"
          onClick={handleHoldExpired}
          disabled={myHeldSeats.length === 0}
          title="Fast-forwards timer to 0s to trigger BullMQ delayed job auto-release"
        >
          <TimerReset size={14} />
          <span>Force Timeout Expiry</span>
        </button>

        {/* Run Latency Benchmark */}
        <button
          className="sim-action-btn"
          onClick={runLatencyBenchmark}
          title="Measure p50, p95, p99 Redis in-memory evaluation latency"
        >
          <Activity size={14} />
          <span>Run Benchmark</span>
        </button>

        {/* Audit Log Drawer Toggle */}
        <button
          className={`sim-action-btn ${isFeedOpen ? 'active' : ''}`}
          onClick={() => setIsFeedOpen(!isFeedOpen)}
        >
          <Terminal size={14} />
          <span>{isFeedOpen ? 'Hide Logs' : 'Live Logs'}</span>
        </button>
      </div>
    </div>
  );
};

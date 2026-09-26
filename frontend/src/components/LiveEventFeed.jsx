import React from 'react';
import { X, Terminal, Trash2 } from 'lucide-react';
import { useSeats } from '../context/SeatContext';

export const LiveEventFeed = () => {
  const { logs, isFeedOpen, setIsFeedOpen } = useSeats();

  if (!isFeedOpen) return null;

  return (
    <div className="feed-drawer">
      <div className="feed-header">
        <div className="feed-title">
          <Terminal size={16} color="#06b6d4" />
          <span>Real-Time Distributed Lock & WebSocket Event Stream</span>
        </div>
        <button
          className="close-btn"
          onClick={() => setIsFeedOpen(false)}
          title="Close Audit Stream"
        >
          <X size={16} />
        </button>
      </div>

      <div className="feed-list">
        {logs.map((log) => (
          <div key={log.id} className={`feed-item ${log.type}`}>
            <span className="feed-time">[{log.timestamp}]</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { Header } from './components/Header';
import { TelemetryBar } from './components/TelemetryBar';
import { StageScreen } from './components/StageScreen';
import { GroupSelector } from './components/GroupSelector';
import { SeatGrid } from './components/SeatGrid';
import { CheckoutDrawer } from './components/CheckoutDrawer';
import { SimulationDock } from './components/SimulationDock';
import { LiveEventFeed } from './components/LiveEventFeed';
import { TicketModal } from './components/TicketModal';
import { Toast } from './components/Toast';
import { SeatProvider } from './context/SeatContext';
import './styles/App.css';

export function AppContent() {
  return (
    <div className="app-container">
      {/* Toast Notification Alert */}
      <Toast />

      {/* Navigation & Header */}
      <Header />

      {/* Real-time Telemetry Stats Ribbon */}
      <TelemetryBar />

      {/* Quick Group Booking Selector */}
      <GroupSelector />

      {/* Main Seating Stadium */}
      <main className="arena-container">
        <StageScreen />
        <SeatGrid />
      </main>

      {/* Checkout Drawer & Cart */}
      <CheckoutDrawer />

      {/* FAANG Concurrency Demo Simulator Dock */}
      <SimulationDock />

      {/* Live Transaction & WebSocket Log Stream */}
      <LiveEventFeed />

      {/* Digital Ticket Modal */}
      <TicketModal />
    </div>
  );
}

export default function App() {
  return (
    <SeatProvider>
      <AppContent />
    </SeatProvider>
  );
}

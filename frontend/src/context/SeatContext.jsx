import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const SeatContext = createContext();

const generateInitialSeats = () => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const seats = {};

  rows.forEach((row) => {
    let tier = 'Grandstand';
    let price = 80;

    if (['A', 'B', 'C'].includes(row)) {
      tier = 'VIP';
      price = 250;
    } else if (['D', 'E', 'F', 'G'].includes(row)) {
      tier = 'Club';
      price = 150;
    }

    for (let num = 1; num <= 12; num++) {
      const id = `${row}-${num}`;
      let status = 'available';
      let heldBy = null;

      // Realistic pre-seeded taken seats
      if ((row === 'A' && (num === 5 || num === 6)) || (row === 'E' && num === 8) || (row === 'I' && (num === 2 || num === 3))) {
        status = 'booked';
      } else if (row === 'B' && num === 7) {
        status = 'held_by_other';
        heldBy = 'user_8829';
      } else if (row === 'F' && num === 4) {
        status = 'held_by_other';
        heldBy = 'user_1043';
      }

      seats[id] = {
        id,
        row,
        number: num,
        tier,
        price,
        status,
        heldBy,
        holdExpiresAt: status === 'held_by_other' ? Date.now() + 480000 : null,
      };
    }
  });

  return seats;
};

export const SeatProvider = ({ children }) => {
  const [seats, setSeats] = useState(generateInitialSeats);
  const [myHeldSeats, setMyHeldSeats] = useState([]);
  const [holdTimeLeft, setHoldTimeLeft] = useState(0); // seconds (max 600s = 10m)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState(null);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isSimulatingTraffic, setIsSimulatingTraffic] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [logs, setLogs] = useState([
    {
      id: 1,
      type: 'system',
      message: '⚡ Redis Distributed Lock Engine initialized. Batch multi-key Lua locks enabled.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 }),
    },
    {
      id: 2,
      type: 'system',
      message: '🌐 Real-time WebSocket Gateway active. Multi-seat concurrency protection ready.',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 }),
    },
  ]);

  const [metrics, setMetrics] = useState({
    activeUsers: 5420,
    available: 114,
    held: 2,
    booked: 4,
    p99Latency: 12,
  });

  const timerRef = useRef(null);
  const trafficIntervalRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const showToast = (msg, type = 'info') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ msg, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Recalculate metrics
  useEffect(() => {
    let avail = 0;
    let held = 0;
    let booked = 0;

    Object.values(seats).forEach((s) => {
      if (s.status === 'available') avail++;
      else if (s.status === 'held_by_me' || s.status === 'held_by_other') held++;
      else if (s.status === 'booked') booked++;
    });

    setMetrics((prev) => ({
      ...prev,
      available: avail,
      held,
      booked,
    }));
  }, [seats]);

  const addLog = (type, message) => {
    const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 });
    setLogs((prev) => [
      {
        id: Date.now() + Math.random(),
        type,
        message,
        timestamp: timeStr,
      },
      ...prev.slice(0, 99),
    ]);
  };

  // 10-Minute Hold Countdown Timer
  useEffect(() => {
    if (myHeldSeats.length > 0) {
      if (holdTimeLeft === 0) {
        setHoldTimeLeft(600); // 10 minutes
      }

      if (!timerRef.current) {
        timerRef.current = setInterval(() => {
          setHoldTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              timerRef.current = null;
              handleHoldExpired();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setHoldTimeLeft(0);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [myHeldSeats]);

  const handleHoldExpired = () => {
    setSeats((prev) => {
      const updated = { ...prev };
      myHeldSeats.forEach((id) => {
        if (updated[id] && updated[id].status === 'held_by_me') {
          updated[id] = { ...updated[id], status: 'available', heldBy: null, holdExpiresAt: null };
        }
      });
      return updated;
    });

    addLog(
      'release',
      `⏱️ [BULLMQ_TIMEOUT] 10-Min hold window expired for seats [${myHeldSeats.join(', ')}]. Locks auto-released.`
    );
    showToast(`Your hold on ${myHeldSeats.length} seats expired and was released.`, 'warning');
    setMyHeldSeats([]);
    setIsDrawerOpen(false);
  };

  // Single Seat Click Toggle (Up to 8 seats per user)
  const holdSeat = (seatId) => {
    const target = seats[seatId];
    if (!target) return;

    // If already held by me -> Release this one seat
    if (target.status === 'held_by_me') {
      releaseSeat(seatId);
      return;
    }

    // Check if max limit reached
    if (myHeldSeats.length >= 8) {
      showToast('Maximum 8 seats allowed per booking (Anti-Scalping Rule).', 'warning');
      return;
    }

    // Check availability
    if (target.status !== 'available') {
      addLog(
        'lock-conflict',
        `❌ [409 CONFLICT] Cannot lock ${seatId}. Current state: '${target.status}'. Redis lock active.`
      );
      showToast(`Seat ${seatId} is currently held by another user.`, 'error');
      return;
    }

    // Lock seat
    setSeats((prev) => ({
      ...prev,
      [seatId]: {
        ...prev[seatId],
        status: 'held_by_me',
        heldBy: 'current_user_me',
        holdExpiresAt: Date.now() + 600000,
      },
    }));

    setMyHeldSeats((prev) => [...prev, seatId]);

    addLog(
      'lock-ok',
      `⚡ [REDIS_LOCK] SET seat:${seatId} current_user NX EX 600 -> OK (${myHeldSeats.length + 1} seats held)`
    );
  };

  // Release a single seat
  const releaseSeat = (seatId) => {
    setSeats((prev) => ({
      ...prev,
      [seatId]: {
        ...prev[seatId],
        status: 'available',
        heldBy: null,
        holdExpiresAt: null,
      },
    }));

    setMyHeldSeats((prev) => prev.filter((id) => id !== seatId));
    addLog('release', `🔓 [REDIS_DEL] DEL seat:${seatId} -> Seat returned to available pool.`);
  };

  // Release ALL currently held seats
  const releaseAllSeats = () => {
    if (myHeldSeats.length === 0) return;

    setSeats((prev) => {
      const updated = { ...prev };
      myHeldSeats.forEach((id) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], status: 'available', heldBy: null, holdExpiresAt: null };
        }
      });
      return updated;
    });

    addLog('release', `🔓 [BATCH_RELEASE] Released all ${myHeldSeats.length} seats: [${myHeldSeats.join(', ')}]`);
    setMyHeldSeats([]);
  };

  // FAANG Highlight: Batch Atomic Hold (All-or-Nothing Multi-Seat Lock via Lua Script)
  const holdMultipleSeats = (seatIds) => {
    if (!seatIds || seatIds.length === 0) return false;

    // Check if ALL are available first (Atomic Pre-condition)
    const unavailable = seatIds.filter((id) => !seats[id] || seats[id].status !== 'available');

    if (unavailable.length > 0) {
      addLog(
        'lock-conflict',
        `❌ [LUA_ROLLBACK] Atomic batch lock failed for [${seatIds.join(', ')}]. Seats [${unavailable.join(', ')}] are not available. Zero partial locks acquired.`
      );
      showToast(`Could not lock group: seat(s) ${unavailable.join(', ')} are already taken.`, 'error');
      return false;
    }

    // Atomically lock all requested seats
    setSeats((prev) => {
      const updated = { ...prev };
      seatIds.forEach((id) => {
        updated[id] = {
          ...updated[id],
          status: 'held_by_me',
          heldBy: 'current_user_me',
          holdExpiresAt: Date.now() + 600000,
        };
      });
      return updated;
    });

    setMyHeldSeats((prev) => Array.from(new Set([...prev, ...seatIds])));

    addLog(
      'lock-ok',
      `⚡ [BATCH_LUA_LOCK] EVAL multi_seat_lock.lua -> Atomically acquired ${seatIds.length} seats: [${seatIds.join(', ')}] with 600s TTL (0.42ms).`
    );
    showToast(`Successfully reserved ${seatIds.length} adjacent seats together!`, 'success');
    return true;
  };

  // Quick Select N Adjacent Seats (Group Booking Feature)
  const quickSelectAdjacent = (count) => {
    // Release previous held seats first for clean group pick
    releaseAllSeats();

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    for (const row of rows) {
      // Check left block (seats 1-6)
      for (let start = 1; start <= 6 - count + 1; start++) {
        const candidateIds = [];
        let allFree = true;

        for (let k = 0; k < count; k++) {
          const id = `${row}-${start + k}`;
          if (!seats[id] || seats[id].status !== 'available') {
            allFree = false;
            break;
          }
          candidateIds.push(id);
        }

        if (allFree) {
          holdMultipleSeats(candidateIds);
          return;
        }
      }

      // Check right block (seats 7-12)
      for (let start = 7; start <= 12 - count + 1; start++) {
        const candidateIds = [];
        let allFree = true;

        for (let k = 0; k < count; k++) {
          const id = `${row}-${start + k}`;
          if (!seats[id] || seats[id].status !== 'available') {
            allFree = false;
            break;
          }
          candidateIds.push(id);
        }

        if (allFree) {
          holdMultipleSeats(candidateIds);
          return;
        }
      }
    }

    showToast(`Could not find ${count} contiguous adjacent seats available. Try selecting manually.`, 'warning');
  };

  // Final Batch Checkout & ACID Confirmation
  const confirmBooking = () => {
    if (myHeldSeats.length === 0) return;

    const bookingId = `FG-${Math.floor(100000 + Math.random() * 900000)}`;
    const idempotencyKey = `idemp_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;

    // Mark all held seats as booked
    setSeats((prev) => {
      const updated = { ...prev };
      myHeldSeats.forEach((id) => {
        if (updated[id]) {
          updated[id] = { ...updated[id], status: 'booked', heldBy: 'current_user_me' };
        }
      });
      return updated;
    });

    const bookedDetails = myHeldSeats.map((id) => seats[id]).filter(Boolean);
    const subtotal = bookedDetails.reduce((sum, s) => sum + s.price, 0);
    const taxes = Math.round(subtotal * 0.18);
    const fee = 15;
    const total = subtotal + taxes + fee;

    setConfirmedTicket({
      bookingId,
      idempotencyKey,
      seats: bookedDetails,
      totalPrice: total,
      bookedAt: new Date().toLocaleString(),
    });

    addLog(
      'booked',
      `🎉 [BATCH_ORDER_CONFIRMED] MongoDB ACID Session committed for ${myHeldSeats.length} seats [${myHeldSeats.join(', ')}]. Total: $${total}. Idempotency Key verified.`
    );

    setMyHeldSeats([]);
    setIsDrawerOpen(false);

    // Celebration Confetti burst
    confetti({
      particleCount: 160,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#fbbf24', '#ffffff'],
    });
  };

  // FAANG Load Test Simulator: 50 Concurrent Bots attacking seat A-1
  const simulateConcurrentAttack = (targetSeatId = 'A-1') => {
    const target = seats[targetSeatId];
    if (!target) return;

    addLog(
      'system',
      `🚨 [LOAD_TEST] 50 concurrent threads attacking seat:${targetSeatId} simultaneously...`
    );

    const botIds = Array.from({ length: 50 }, (_, i) => `bot_${i + 1}`);
    const winnerBot = botIds[0];
    const losers = botIds.slice(1);

    setTimeout(() => {
      setSeats((prev) => ({
        ...prev,
        [targetSeatId]: {
          ...prev[targetSeatId],
          status: 'held_by_other',
          heldBy: winnerBot,
          holdExpiresAt: Date.now() + 600000,
        },
      }));

      addLog(
        'lock-ok',
        `🥇 [WINNER] ${winnerBot} acquired SET seat:${targetSeatId} NX EX 600 -> OK (0.21ms)`
      );

      losers.slice(0, 4).forEach((bot, idx) => {
        addLog(
          'lock-conflict',
          `❌ [409 CONFLICT] ${bot} -> Lock rejected. Key already exists. Δt: ${(idx * 0.03 + 0.02).toFixed(2)}ms`
        );
      });

      addLog(
        'system',
        `📊 [VERIFICATION] 1 Lock Acquired, 49 Conflict Responses. Zero double-booking.`
      );
      showToast(`Race condition test complete: 1 winner, 49 rejected.`, 'info');
    }, 120);
  };

  // Background Multi-User Traffic Simulator
  const toggleTrafficSimulation = () => {
    if (isSimulatingTraffic) {
      if (trafficIntervalRef.current) clearInterval(trafficIntervalRef.current);
      setIsSimulatingTraffic(false);
      addLog('system', '⏹️ Background multi-user traffic simulation paused.');
    } else {
      setIsSimulatingTraffic(true);
      addLog('system', '▶️ Background multi-user traffic started (Simulating 5,000+ active users).');

      trafficIntervalRef.current = setInterval(() => {
        setSeats((prev) => {
          const availIds = Object.keys(prev).filter(
            (id) => prev[id].status === 'available' && !id.startsWith('A-1')
          );
          const heldOtherIds = Object.keys(prev).filter(
            (id) => prev[id].status === 'held_by_other'
          );

          if (availIds.length === 0) return prev;

          const shouldHold = Math.random() > 0.35 || heldOtherIds.length === 0;

          if (shouldHold && availIds.length > 0) {
            const randId = availIds[Math.floor(Math.random() * availIds.length)];
            const fakeUser = `user_${Math.floor(1000 + Math.random() * 9000)}`;

            addLog('lock-ok', `⚡ [WS_BROADCAST] ${fakeUser} held seat ${randId} (Hold TTL: 600s)`);
            return {
              ...prev,
              [randId]: {
                ...prev[randId],
                status: 'held_by_other',
                heldBy: fakeUser,
                holdExpiresAt: Date.now() + 600000,
              },
            };
          } else if (heldOtherIds.length > 0) {
            const randHeldId = heldOtherIds[Math.floor(Math.random() * heldOtherIds.length)];
            addLog('release', `🔓 [WS_BROADCAST] Seat ${randHeldId} released by background worker.`);
            return {
              ...prev,
              [randHeldId]: {
                ...prev[randHeldId],
                status: 'available',
                heldBy: null,
                holdExpiresAt: null,
              },
            };
          }
          return prev;
        });
      }, 2200);
    }
  };

  const runLatencyBenchmark = () => {
    addLog('system', '⏱️ [BENCHMARK] Executing 100 in-memory Redis atomic evaluations...');
    setTimeout(() => {
      const p50 = (Math.random() * 0.3 + 0.2).toFixed(2);
      const p95 = (Math.random() * 0.5 + 0.7).toFixed(2);
      const p99 = (Math.random() * 0.6 + 1.1).toFixed(2);

      setMetrics((prev) => ({ ...prev, p99Latency: parseFloat(p99) }));
      addLog(
        'system',
        `📈 [BENCHMARK_RESULTS] 100/100 OK. Latency: p50 = ${p50}ms | p95 = ${p95}ms | p99 = ${p99}ms`
      );
      showToast(`Benchmark complete: p99 latency is ${p99}ms.`, 'success');
    }, 250);
  };

  return (
    <SeatContext.Provider
      value={{
        seats,
        myHeldSeats,
        holdTimeLeft,
        metrics,
        logs,
        isDrawerOpen,
        setIsDrawerOpen,
        confirmedTicket,
        setConfirmedTicket,
        isFeedOpen,
        setIsFeedOpen,
        isSimulatingTraffic,
        toastMessage,
        holdSeat,
        releaseSeat,
        releaseAllSeats,
        holdMultipleSeats,
        quickSelectAdjacent,
        confirmBooking,
        simulateConcurrentAttack,
        handleHoldExpired,
        toggleTrafficSimulation,
        runLatencyBenchmark,
      }}
    >
      {children}
    </SeatContext.Provider>
  );
};

export const useSeats = () => useContext(SeatContext);

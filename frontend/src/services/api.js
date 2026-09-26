const API_BASE_URL = 'http://localhost:5001/api';

export const fetchSeats = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/seats`);
    return await res.json();
  } catch (error) {
    console.warn('Backend API unreachable, using local state:', error);
    return null;
  }
};

export const holdSeatApi = async (seatId, userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/seats/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatId, userId }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const batchHoldSeatsApi = async (seatIds, userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/seats/batch-hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIds, userId }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const releaseSeatsApi = async (seatIds, userId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/seats/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIds, userId }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const checkoutBookingApi = async (payload, idempotencyKey) => {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (error) {
    return { success: false, error: error.message };
  }
};

\# ⚡ FlashGrid



FlashGrid is a ticket booking system built to handle multiple users trying to book seats at the same time.



It uses React, Node.js, Redis, MongoDB, and WebSockets to keep seat availability updated in real time.



The system prevents double booking by temporarily locking seats and automatically releasing them when the hold expires.



\## 🚀 Features



\- Real-time seat availability

\- Redis-based distributed seat locking

\- Atomic multi-seat booking

\- Automatic seat release after timeout

\- MongoDB for persistent data

\- WebSocket updates using Socket.IO

\- BullMQ for scheduled seat expiry

\- Protection against race conditions

\- REST APIs for seat and booking operations



\## 🛠️ Tech Stack



\*\*Frontend\*\*

\- React

\- Vite

\- CSS



\*\*Backend\*\*

\- Node.js

\- Express.js

\- Socket.IO



\*\*Database \& Infrastructure\*\*

\- MongoDB

\- Redis

\- BullMQ

\- Docker



\## 📁 Project Structure



```text

flashgrid/

├── backend/

├── frontend/

├── docker-compose.yml

└── .gitignore


How to Run
1. Start MongoDB and Redis

Make sure Docker is running, then execute:

docker compose up -d
2. Start the Backend

Open a terminal:

cd backend
npm install
npm run dev

The backend runs on:

http://localhost:5001

Health check:

http://localhost:5001/health

A successful health check returns the backend status and uptime.

3. Start the Frontend

Open another terminal:

cd frontend
npm install
npm run dev

Then open the local URL provided by Vite.

Seat Locking

When a user selects a seat, FlashGrid creates a temporary lock using Redis.

If another user tries to select the same seat while it is already locked, the request is rejected.

This prevents two users from successfully reserving the same seat at the same time.

The lock automatically expires after the configured hold period, allowing the seat to become available again.

Multi-Seat Atomic Locking

FlashGrid also supports selecting multiple seats together.

The backend uses a Redis Lua script to perform the multi-seat locking operation atomically.

If one of the requested seats cannot be locked, the batch operation fails instead of creating partial locks.

This helps maintain consistency during high-concurrency booking scenarios.

Real-Time Updates

FlashGrid uses Socket.IO to broadcast seat changes to connected users.

The system can broadcast events such as:

Seat held
Multiple seats held
Seat released
Automatic timeout release

This allows different users to see seat availability changes without manually refreshing the page.

Automatic Seat Expiry

Temporary seat holds are handled using BullMQ.

When a seat hold reaches its expiry time, the system releases the Redis lock and broadcasts the release event through Socket.IO.

This prevents seats from remaining locked indefinitely when a user does not complete the booking.

Concurrency Handling

The main purpose of FlashGrid is to demonstrate how a ticket booking system can handle concurrent requests safely.

The project focuses on:

Race-condition prevention
Distributed locking
Atomic operations
Temporary reservations
Automatic reservation expiry
Real-time synchronization
API Endpoints
Health Check
GET /health
Get Seats
GET /api/seats
Hold a Seat
POST /api/seats/hold
Hold Multiple Seats
POST /api/seats/batch-hold
Release Seats
POST /api/seats/release
Example Seat Hold Request
{
  "seatId": "A-1",
  "userId": "test-user-1"
}
Example Response
{
  "success": true,
  "seatId": "A-1",
  "userId": "test-user-1",
  "holdTtl": 600
}

If another user tries to hold the same seat while it is locked, the system returns a conflict response instead of allowing a double booking.

Project Goal

FlashGrid was built to explore the practical challenges of high-concurrency ticket booking systems and demonstrate how Redis distributed locks, atomic operations, queues, databases, and WebSockets can work together.

Author

Govind Thakur

BSc IT Graduate | MCA Student | Software Development Enthusiast


### Then save

Press:

**Ctrl + S**

and close Notepad.

### Check it

Run:

```powershell
Get-Content README.md


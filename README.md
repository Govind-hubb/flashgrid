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


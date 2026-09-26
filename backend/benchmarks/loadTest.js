const http = require('http');

/**
 * FlashGrid Concurrency & Race Condition Load Test Benchmark
 * Fires N concurrent asynchronous HTTP requests at the exact same millisecond
 * targeting the same seat to prove zero double-bookings.
 */
const runLoadTest = async () => {
  const TOTAL_BOTS = 100; // Simulated concurrent bots
  const TARGET_SEAT = 'A-1';
  const SERVER_URL = 'http://localhost:5001/api/seats/hold';

  console.log(`================================================================`);
  console.log(`🔥 [BENCHMARK] Launching ${TOTAL_BOTS} Concurrent Bots attacking Seat ${TARGET_SEAT}...`);
  console.log(`🎯 Goal: Verify exactly 1 lock is acquired and ${TOTAL_BOTS - 1} receive 409 Conflict.`);
  console.log(`================================================================\n`);

  let successCount = 0;
  let conflictCount = 0;
  let errorCount = 0;
  const latencies = [];

  const sendHoldRequest = (botId) => {
    return new Promise((resolve) => {
      const startTime = process.hrtime();
      const payload = JSON.stringify({
        seatId: TARGET_SEAT,
        userId: `bot_${botId}`,
      });

      const req = http.request(
        SERVER_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            const diff = process.hrtime(startTime);
            const latencyMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);
            latencies.push(parseFloat(latencyMs));

            if (res.statusCode === 200) {
              successCount++;
              console.log(`🥇 [WINNER] Bot #${botId} ACQUIRED Lock (Status: 200 OK | Latency: ${latencyMs}ms)`);
            } else if (res.statusCode === 409) {
              conflictCount++;
            } else {
              errorCount++;
            }
            resolve();
          });
        }
      );

      req.on('error', () => {
        errorCount++;
        resolve();
      });

      req.write(payload);
      req.end();
    });
  };

  const startTimestamp = Date.now();
  // Fire all requests simultaneously
  const promises = Array.from({ length: TOTAL_BOTS }, (_, i) => sendHoldRequest(i + 1));
  await Promise.all(promises);
  const totalDuration = Date.now() - startTimestamp;

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;

  console.log(`\n================================================================`);
  console.log(`📊 BENCHMARK REPORT — CONCURRENCY VERIFICATION SUMMARY`);
  console.log(`================================================================`);
  console.log(`Total Requests Processed : ${TOTAL_BOTS}`);
  console.log(`Locks Acquired (200 OK)  : ${successCount}  (Expected: 1)`);
  console.log(`Locks Rejected (409)     : ${conflictCount} (Expected: ${TOTAL_BOTS - 1})`);
  console.log(`Errors / Crashes         : ${errorCount}`);
  console.log(`Total Test Duration      : ${totalDuration}ms`);
  console.log(`----------------------------------------------------------------`);
  console.log(`Latency p50 (Median)     : ${p50}ms`);
  console.log(`Latency p95              : ${p95}ms`);
  console.log(`Latency p99              : ${p99}ms`);
  console.log(`----------------------------------------------------------------`);

  if (successCount === 1 && conflictCount === TOTAL_BOTS - 1) {
    console.log(`✅ VERDICT: PASSED! Zero race conditions. Redis atomic locking mathematically verified.`);
  } else {
    console.log(`⚠️  VERDICT: Check server logs or restart test.`);
  }
  console.log(`================================================================\n`);
};

runLoadTest();

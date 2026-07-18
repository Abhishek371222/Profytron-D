import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Track D7 ladder — set LADDER=100|500|1000 (default 100).
 * Usage:
 *   k6 run -e API_BASE_URL=https://api.example.com -e LADDER=100 performance-tests/d7-ladder.js
 */
const LADDER = Number(__ENV.LADDER || 100);
const API = (__ENV.API_BASE_URL || __ENV.BASE_URL || 'http://localhost:4000').replace(
  /\/$/,
  '',
);

const stages =
  LADDER >= 1000
    ? [
        { duration: '2m', target: 200 },
        { duration: '3m', target: 500 },
        { duration: '3m', target: 1000 },
        { duration: '5m', target: 1000 },
        { duration: '2m', target: 0 },
      ]
    : LADDER >= 500
      ? [
          { duration: '2m', target: 100 },
          { duration: '3m', target: 300 },
          { duration: '3m', target: 500 },
          { duration: '5m', target: 500 },
          { duration: '2m', target: 0 },
        ]
      : [
          { duration: '1m', target: 50 },
          { duration: '2m', target: 100 },
          { duration: '3m', target: 100 },
          { duration: '1m', target: 0 },
        ];

export const options = {
  stages,
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const live = http.get(`${API}/live`);
  check(live, { 'live 200': (r) => r.status === 200 });

  const ready = http.get(`${API}/ready`);
  check(ready, { 'ready 200': (r) => r.status === 200 });

  const health = http.get(`${API}/health`);
  check(health, {
    'health 200': (r) => r.status === 200,
    'health ok|degraded': (r) => {
      try {
        const body = r.json();
        const status = body?.data?.status || body?.status;
        return status === 'ok' || status === 'degraded';
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration for API endpoints
export const options = {
  stages: [
    { duration: '1m', target: 50 },  // Warm up
    { duration: '3m', target: 50 },  // Sustained load
    { duration: '1m', target: 100 }, // Spike test
    { duration: '2m', target: 100 }, // Sustained high load
    { duration: '1m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    errors: ['rate<0.05'],             // Custom error rate
  },
};

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3001';

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Test health endpoint
  let response = http.get(`${BASE_URL}/health`, params);
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 200ms': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);

  sleep(0.5);

  // Test auth endpoints (without actual authentication)
  response = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'testpass'
  }), params);

  // Expect 401 for invalid credentials
  check(response, {
    'login returns 401 for invalid credentials': (r) => r.status === 401,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(0.5);

  // Test signup endpoint
  response = http.post(`${BASE_URL}/auth/signup`, JSON.stringify({
    email: `perf-test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    fullName: 'Performance Test User'
  }), params);

  check(response, {
    'signup status is 201': (r) => r.status === 201,
    'signup response time < 1000ms': (r) => r.timings.duration < 1000,
  }) || errorRate.add(1);

  sleep(1);

  // Test trading signal endpoint (mock authentication)
  const authHeaders = {
    ...params.headers,
    'Authorization': 'Bearer mock-jwt-token-for-performance-test',
  };

  response = http.post(`${BASE_URL}/trading/signal`, JSON.stringify({
    strategyId: 'perf-test-strategy',
    signalType: 'BUY',
    pair: 'BTCUSD',
    price: 45000
  }), { headers: authHeaders });

  // This might fail due to auth, but we're testing the endpoint responsiveness
  check(response, {
    'trading signal response time < 1500ms': (r) => r.timings.duration < 1500,
  }) || errorRate.add(1);

  sleep(2);
}

// Setup function - runs before the test starts
export function setup() {
  console.log('Starting API performance test...');
  console.log(`Target API: ${BASE_URL}`);
}

// Teardown function - runs after the test completes
export function teardown(data) {
  console.log('API performance test completed');
}
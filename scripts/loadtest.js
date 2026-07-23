import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Ramp up to 10 users over 10 seconds
    { duration: '30s', target: 10 }, // Stay at 10 users for 30 seconds
    { duration: '10s', target: 0 },  // Ramp down to 0 users
  ],
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function loadtest() {
  // Test Homepage
  let res = http.get(`${BASE_URL}/`);
  check(res, { 'homepage status was 200': (r) => r.status == 200 });
  sleep(1);

  // Test City Page
  res = http.get(`${BASE_URL}/city/mcdonough`);
  check(res, { 'city page status was 200': (r) => r.status == 200 });
  sleep(1);

  // Test Listing Detail Page
  res = http.get(`${BASE_URL}/listings/roman-kraft-hotel`);
  check(res, { 'listing page status was 200': (r) => r.status == 200 });
  sleep(1);

  // Test Deals Page
  res = http.get(`${BASE_URL}/deals`);
  check(res, { 'deals page status was 200': (r) => r.status == 200 });
  sleep(1);
}

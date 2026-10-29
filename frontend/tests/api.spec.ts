// tests/api.spec.ts
import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5000/api';

function randomEmail() {
  const ts = Date.now();
  return `test_user_${ts}@example.com`;
}

let token: string;
let conversationId: string;

test('Health endpoint works', async ({ request }) => {
  const res = await request.get(`${API_BASE}/status`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.online).toBeTruthy();
});

test('User registration and login', async ({ request }) => {
  const email = randomEmail();
  const pwd = 'TestPass123!';
  // Register
  const regRes = await request.post(`${API_BASE}/auth/register`, {
    data: { name: 'Test User', email, password: pwd, role: 'Customer' },
  });
  expect(regRes.ok()).toBeTruthy();
  const regData = await regRes.json();
  expect(regData.ok).toBeTruthy();
  token = regData.token;
  // Login
  const loginRes = await request.post(`${API_BASE}/auth/login`, {
    data: { email, password: pwd },
  });
  expect(loginRes.ok()).toBeTruthy();
  const loginData = await loginRes.json();
  expect(loginData.ok).toBeTruthy();
  token = loginData.token;
});

test('Chat endpoint returns a response', async ({ request }) => {
  // Assume token from previous test is available
  const chatRes = await request.post(`${API_BASE}/chat`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { message: 'Hello', conversation_id: '' },
  });
  expect(chatRes.ok()).toBeTruthy();
  const chatData = await chatRes.json();
  expect(chatData.ok).toBeTruthy();
  expect(chatData.message).toBeDefined();
});

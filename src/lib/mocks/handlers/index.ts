import { http, HttpResponse } from 'msw';
import { mockUser, mockStrategies, mockTrades, mockTickerData } from '../data';

export const handlers = [
  // Auth
  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockUser);
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json() as any;
    
    // Demo credentials check
    if (email === 'demo@profytron.com' && password === 'Demo@123') {
      return HttpResponse.json({
        user: mockUser,
        accessToken: 'mock_token_' + Date.now()
      });
    }

    return new HttpResponse(JSON.stringify({ error: 'Invalid email or password' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { email } = await request.json() as any;
    
    // Simulate email already exists for one specific case
    if (email === 'voss@profytron.ai') {
      return new HttpResponse(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return HttpResponse.json({ success: true });
  }),

  http.post('/api/auth/google/mock', () => {
    return HttpResponse.json({
      user: mockUser,
      accessToken: 'google_mock_token_' + Date.now()
    });
  }),

  // Strategies
  http.get('/api/strategies', () => {
    return HttpResponse.json(mockStrategies);
  }),

  http.get('/api/strategies/:id', ({ params }) => {
    const strategy = mockStrategies.find(s => s.id === params.id);
    if (!strategy) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(strategy);
  }),

  // Trades
  http.get('/api/trades', () => {
    return HttpResponse.json(mockTrades);
  }),

  // Market
  http.get('/api/market/ticker', () => {
    return HttpResponse.json(mockTickerData);
  }),

  // Trading Actions
  http.post('/api/trades/execute', async ({ request }) => {
    const data = await request.json();
    const newTrade = {
      id: `t_${Math.random().toString(36).substr(2, 9)}`,
      status: 'Open',
      timestamp: new Date().toISOString(),
      ...(data as any)
    };
    return HttpResponse.json(newTrade);
  }),
];

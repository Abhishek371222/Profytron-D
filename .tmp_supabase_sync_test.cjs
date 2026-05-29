const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

(async () => {
  const supabaseUrl = 'https://nghlhhsdtewrchdeyean.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naGxoaHNkdGV3cmNoZGV5ZWFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjEzNDMsImV4cCI6MjA5MDE5NzM0M30.zV_eatJVLje-QbDVHFfZI1wuVioRd-6xT2ik7AgyT3Q';
  const client = createClient(supabaseUrl, anonKey);

  const email = `copilot.test.${Date.now()}@example.com`;
  const password = 'T3stPass!23456';

  let session = null;

  const signUp = await client.auth.signUp({ email, password, options: { data: { full_name: 'Copilot Test User' } } });
  if (signUp.error) {
    console.log('SIGNUP_ERROR', signUp.error.message);
  }
  if (signUp.data?.session?.access_token) {
    session = signUp.data.session;
  }

  if (!session) {
    const signIn = await client.auth.signInWithPassword({ email, password });
    if (signIn.error) {
      console.log('SIGNIN_ERROR', signIn.error.message);
      process.exit(2);
    }
    session = signIn.data.session;
  }

  const payload = {
    token: session.access_token,
    email,
    fullName: 'Copilot Test User',
    avatarUrl: 'https://example.com/avatar.png',
    provider: 'email'
  };

  try {
    const res = await axios.post('http://localhost:4000/v1/auth/supabase', payload, { validateStatus: () => true });
    console.log('API_STATUS', res.status);
    console.log('API_BODY', JSON.stringify(res.data));
  } catch (e) {
    console.log('API_ERR', e.message);
    process.exit(3);
  }
})();

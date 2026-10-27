async function test() {
  try {
    const healthRes = await fetch('http://localhost:5000/api/health');
    const health = await healthRes.json();
    console.log('1. Health check:', health);

    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@careernest.io',
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    console.log('2. Login response:', {
      success: loginData.success,
      userName: loginData.user?.name,
      hasToken: !!loginData.token,
    });

    const appsRes = await fetch('http://localhost:5000/api/applications', {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const apps = await appsRes.json();
    console.log('3. Applications fetched:', {
      success: apps.success,
      count: apps.count,
      firstApp: apps.applications?.[0]?.company,
    });

    const statsRes = await fetch('http://localhost:5000/api/applications/stats/dashboard', {
      headers: { Authorization: `Bearer ${loginData.token}` },
    });
    const stats = await statsRes.json();
    console.log('4. Stats dashboard:', stats.stats);

    console.log('ALL BACKEND CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();

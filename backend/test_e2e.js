const baseUrl = 'http://localhost:5000/api';

async function runE2ETests() {
  console.log('🚀 Starting CareerNest End-to-End Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    console.log('[Test 1] Backend & Database Health');
    const healthRes = await fetch(`${baseUrl}/health`);
    const health = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint responds with 200 OK');
    assert(health.database === 'connected', 'MongoDB connection is ACTIVE');

    // 2. Authentication - Registration
    console.log('\n[Test 2] User Registration');
    const testEmail = `student_${Date.now()}@university.edu`;
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jordan Lee',
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.status === 201, 'New user registered with 201 Created');
    assert(!!regData.token, 'JWT token returned on registration');
    assert(regData.user.name === 'Jordan Lee', 'User name stored accurately');

    const tokenJordan = regData.token;

    // 3. Authentication - Login
    console.log('\n[Test 3] User Login & Password Verification');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Login succeeded with 200 OK');
    assert(!!loginData.token, 'JWT token returned on login');

    // Wrong password test
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'WrongPassword!',
      }),
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    // 4. Data Isolation Check (New user has 0 applications initially)
    console.log('\n[Test 4] User Data Isolation');
    const jordanAppsRes = await fetch(`${baseUrl}/applications`, {
      headers: { Authorization: `Bearer ${tokenJordan}` },
    });
    const jordanApps = await jordanAppsRes.json();
    assert(jordanApps.count === 0, 'New user has exactly 0 applications (isolated data)');

    // 5. Create Application
    console.log('\n[Test 5] Application Creation (CRUD - Create)');
    const createRes = await fetch(`${baseUrl}/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenJordan}`,
      },
      body: JSON.stringify({
        company: 'Microsoft',
        role: 'Software Engineer Intern',
        applicationUrl: 'https://careers.microsoft.com',
        location: 'Redmond, WA',
        salary: '$54/hr + Housing',
        dateApplied: new Date().toISOString(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Applied',
        notes: 'Submitted through university campus portal.',
      }),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Created Microsoft application with 201 Created');
    assert(createData.application.company === 'Microsoft', 'Application company recorded correctly');
    const appId = createData.application._id;

    // 6. Update Application
    console.log('\n[Test 6] Application Update (CRUD - Update)');
    const updateRes = await fetch(`${baseUrl}/applications/${appId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenJordan}`,
      },
      body: JSON.stringify({
        salary: '$58/hr + Housing',
        notes: 'Updated compensation details & recruiter email noted.',
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Updated application successfully');
    assert(updateData.application.salary === '$58/hr + Housing', 'Salary updated to $58/hr');

    // 7. Pipeline Status Quick Update (PATCH)
    console.log('\n[Test 7] Pipeline Status Transition (PATCH /status)');
    const patchRes = await fetch(`${baseUrl}/applications/${appId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenJordan}`,
      },
      body: JSON.stringify({ status: 'Interview' }),
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200, 'Status updated via PATCH');
    assert(patchData.application.status === 'Interview', 'Status changed to Interview');

    // 8. Search and Filtering
    console.log('\n[Test 8] Search and Filtering');
    const searchMatchRes = await fetch(`${baseUrl}/applications?search=Micro`, {
      headers: { Authorization: `Bearer ${tokenJordan}` },
    });
    const searchMatch = await searchMatchRes.json();
    assert(searchMatch.count === 1, 'Search for "Micro" returned 1 match');

    const searchNoMatchRes = await fetch(`${baseUrl}/applications?search=NonExistentCompany`, {
      headers: { Authorization: `Bearer ${tokenJordan}` },
    });
    const searchNoMatch = await searchNoMatchRes.json();
    assert(searchNoMatch.count === 0, 'Search for non-existent company returned 0 matches');

    const filterStatusRes = await fetch(`${baseUrl}/applications?status=Interview`, {
      headers: { Authorization: `Bearer ${tokenJordan}` },
    });
    const filterStatus = await filterStatusRes.json();
    assert(filterStatus.count === 1, 'Filter by status "Interview" returned 1 record');

    // 9. Dashboard Statistics Calculation
    console.log('\n[Test 9] Dashboard Metrics Real Aggregation');
    const statsRes = await fetch(`${baseUrl}/applications/stats/dashboard`, {
      headers: { Authorization: `Bearer ${tokenJordan}` },
    });
    const statsData = await statsRes.json();
    assert(statsData.stats.totalApplications === 1, 'Total applications metric equals 1');
    assert(statsData.stats.inProgress === 1, 'In Progress metric equals 1');
    assert(statsData.stats.statusCounts.Interview === 1, 'Interview count equals 1');

    // 10. Delete Application
    console.log('\n[Test 10] Application Deletion (CRUD - Delete)');
    const deleteRes = await fetch(`${baseUrl}/applications/${appId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenJordan}` },
    });
    assert(deleteRes.status === 200, 'Application deleted with 200 OK');

    const verifyDeleteRes = await fetch(`${baseUrl}/applications/${appId}`, {
      headers: { Authorization: `Bearer ${tokenJordan}` },
    });
    assert(verifyDeleteRes.status === 404, 'Deleted application returns 404 Not Found');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed === 0) {
      console.log('🎉 ALL END-TO-END WORKFLOWS PASSED VERIFICATION!');
    }
  } catch (err) {
    console.error('Test Execution Error:', err);
  }
}

runE2ETests();

async function testInterviewAdd() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@careernest.io',
        password: 'Password123!',
      }),
    });
    const { token } = await loginRes.json();

    console.log('Testing 1: Add application with status: "Interview" and interviewDate filled');
    const res1 = await fetch('http://localhost:5000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        company: 'Adobe',
        role: 'Machine Learning Intern',
        location: 'San Jose, CA',
        salary: '$55/hr',
        status: 'Interview',
        interviewDate: new Date('2026-11-20T14:30:00').toISOString(),
        deadline: new Date('2026-11-15').toISOString(),
        notes: 'Interview scheduled for ML team.',
      }),
    });
    const data1 = await res1.json();
    console.log('Result 1 status:', res1.status, 'success:', data1.success, 'company:', data1.application?.company);

    console.log('Testing 2: Add application with status: "Interview" and interviewDate empty/null');
    const res2 = await fetch('http://localhost:5000/api/applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        company: 'Airbnb',
        role: 'Data Science Intern',
        location: 'Remote',
        salary: '$62/hr',
        status: 'Interview',
        interviewDate: null,
        deadline: null,
        notes: 'Waiting for recruiter to send calendar invite.',
      }),
    });
    const data2 = await res2.json();
    console.log('Result 2 status:', res2.status, 'success:', data2.success, 'company:', data2.application?.company);

    // Clean up test records
    if (data1.application?._id) {
      await fetch(`http://localhost:5000/api/applications/${data1.application._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    if (data2.application?._id) {
      await fetch(`http://localhost:5000/api/applications/${data2.application._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    }
    console.log('Cleaned up test records.');
  } catch (err) {
    console.error('Test error:', err);
  }
}

testInterviewAdd();

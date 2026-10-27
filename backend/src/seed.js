const dns = require('dns');
if (dns && typeof dns.setServers === 'function') {
  try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}
}
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Application = require('./models/Application');

dotenv.config();


const seedSampleData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/careernest';
    await mongoose.connect(mongoUri, { dbName: 'careernest' });
    console.log('[Seed] Connected to MongoDB...');


    // Check if demo user already exists
    let demoUser = await User.findOne({ email: 'student@careernest.io' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Alex Rivera',
        email: 'student@careernest.io',
        password: 'Password123!',
      });
      console.log('[Seed] Demo user created: student@careernest.io / Password123!');
    } else {
      console.log('[Seed] Demo user already exists: student@careernest.io');
    }


    // Clear existing applications for demo user
    await Application.deleteMany({ user: demoUser._id });

    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    const sampleApplications = [
      {
        user: demoUser._id,
        company: 'Stripe',
        role: 'Software Engineering Intern — Core Infrastructure',
        applicationUrl: 'https://stripe.com/jobs',
        location: 'San Francisco, CA (Hybrid)',
        salary: '$58/hr + Housing',
        dateApplied: new Date(now.getTime() - 14 * day),
        deadline: new Date(now.getTime() + 5 * day),
        status: 'Interview',
        interviewDate: new Date(now.getTime() + 3 * day),
        notes: 'Round 1 technical phone screen completed. System design & coding scheduled for next Thursday.',
      },
      {
        user: demoUser._id,
        company: 'Datadog',
        role: 'Full Stack Engineering Intern',
        applicationUrl: 'https://datadoghq.com/careers',
        location: 'New York, NY',
        salary: '$54/hr',
        dateApplied: new Date(now.getTime() - 10 * day),
        deadline: new Date(now.getTime() + 2 * day),
        status: 'Assessment',
        interviewDate: null,
        notes: 'HackerRank coding assessment sent. 90 minutes test covering algorithms and API design.',
      },
      {
        user: demoUser._id,
        company: 'Vercel',
        role: 'Frontend Engineering Intern — Next.js Team',
        applicationUrl: 'https://vercel.com/careers',
        location: 'Remote',
        salary: '$50/hr',
        dateApplied: new Date(now.getTime() - 21 * day),
        deadline: new Date(now.getTime() - 2 * day),
        status: 'Offer',
        interviewDate: null,
        notes: 'Received official offer letter! Compensation package: $50/hr + $2,000 remote work stipend.',
      },
      {
        user: demoUser._id,
        company: 'Figma',
        role: 'Product Engineering Intern',
        applicationUrl: 'https://figma.com/careers',
        location: 'San Francisco, CA',
        salary: '$60/hr',
        dateApplied: new Date(now.getTime() - 3 * day),
        deadline: new Date(now.getTime() + 10 * day),
        status: 'Applied',
        interviewDate: null,
        notes: 'Submitted resume and portfolio linking to recent open source React project.',
      },
      {
        user: demoUser._id,
        company: 'Palantir',
        role: 'Forward Deployed Software Engineer Intern',
        applicationUrl: 'https://palantir.com/careers',
        location: 'New York, NY',
        salary: '$55/hr',
        dateApplied: new Date(now.getTime() - 30 * day),
        deadline: new Date(now.getTime() - 15 * day),
        status: 'Rejected',
        interviewDate: null,
        notes: 'Reached final round. Position filled internally. Recruiter encouraged re-applying next term.',
      },
      {
        user: demoUser._id,
        company: 'Spotify',
        role: 'Backend Engineering Intern — Audio Platform',
        applicationUrl: 'https://spotify.com/jobs',
        location: 'Boston, MA (Hybrid)',
        salary: '$52/hr',
        dateApplied: new Date(now.getTime() - 7 * day),
        deadline: new Date(now.getTime() + 14 * day),
        status: 'Applied',
        interviewDate: null,
        notes: 'Referral submitted through university alumni network.',
      },
    ];

    await Application.insertMany(sampleApplications);
    console.log(`[Seed] Seeded ${sampleApplications.length} sample applications for demo user.`);

    await mongoose.disconnect();
    console.log('[Seed] Database disconnected cleanly.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]', error);
    process.exit(1);
  }
};

seedSampleData();

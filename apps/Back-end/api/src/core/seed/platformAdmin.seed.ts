/**
 * platformAdmin.seed.ts
 *
 * One-time script to create the first platform_admin account.
 * Run ONCE after deploying to a fresh environment:
 *
 *   npx ts-node src/core/seed/platformAdmin.seed.ts
 *
 * Store the credentials somewhere safe (password manager).
 * There is intentionally no API endpoint that can create a platform_admin —
 * this seed script is the only door.
 */

import mongoose from 'mongoose';
import { User } from '../../modules/auth/user.model';
import dotenv from 'dotenv';

dotenv.config();

const PLATFORM_ADMIN_EMAIL    = process.env.PLATFORM_ADMIN_EMAIL    || 'platform@yourdomain.com';
const PLATFORM_ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_PASSWORD || 'ChangeMe123!';
const PLATFORM_ADMIN_FIRST    = process.env.PLATFORM_ADMIN_FIRST    || 'Platform';
const PLATFORM_ADMIN_LAST     = process.env.PLATFORM_ADMIN_LAST     || 'Admin';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kagohc';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB:', uri);

  const existing = await User.findOne({ email: PLATFORM_ADMIN_EMAIL });
  if (existing) {
    console.log(`platform_admin already exists for ${PLATFORM_ADMIN_EMAIL} — skipping.`);
    await mongoose.disconnect();
    return;
  }

  // NOTE: ownerId is intentionally omitted (not set to null) — IUser.ownerId
  // is typed as a required ObjectId with no null/undefined union, so passing
  // null fails to compile under strict mode. platform_admin accounts have no
  // tenant, so we simply don't set the field; Mongoose leaves it undefined
  // at the document level, which is what we want.
  const admin = await User.create({
    email: PLATFORM_ADMIN_EMAIL,
    password: PLATFORM_ADMIN_PASSWORD, // pre-save hook hashes this
    firstName: PLATFORM_ADMIN_FIRST,
    lastName: PLATFORM_ADMIN_LAST,
    role: 'platform_admin',
  } as any);

  console.log('✅ platform_admin created:');
  console.log('   ID:    ', admin._id.toString());
  console.log('   Email: ', admin.email);
  console.log('   Role:  ', admin.role);
  console.log('\nStore these credentials in your password manager.');
  console.log('Do NOT run this script again on the same database.');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
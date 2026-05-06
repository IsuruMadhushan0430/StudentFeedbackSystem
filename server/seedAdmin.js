const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || 'System Admin';

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set');
  }

  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/student-feedback', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    const existingAdmin = await User.findOne({ role: 'admin' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    if (existingAdmin) {
      existingAdmin.name = adminName;
      existingAdmin.email = adminEmail;
      existingAdmin.password = hashedPassword;
      existingAdmin.isApproved = true;
      await existingAdmin.save();
      console.log('Admin user updated successfully.');
      return;
    }

    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
    });

    await adminUser.save();
    console.log('Admin user created successfully.');
  } finally {
    await mongoose.disconnect();
  }
};

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to seed admin:', err.message);
    process.exit(1);
  });

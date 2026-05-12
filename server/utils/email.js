const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error('SMTP configuration is missing');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
};

const sendStudentWelcomeEmail = async ({ to, name, tempPassword, loginUrl }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Welcome to the Student Feedback System</h2>
      <p style="margin: 0 0 12px;">Hi ${name || 'Student'},</p>
      <p style="margin: 0 0 12px;">
        Your account has been created. Use the credentials below to log in and update your password.
      </p>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px;"><strong>Username:</strong> ${to}</p>
        <p style="margin: 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <a href="${loginUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">Log in now</a>
      <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">You will be asked to change your password after your first login.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: 'Your Student Feedback System Account',
    html,
  });
};

const sendLecturerWelcomeEmail = async ({ to, name, tempPassword, loginUrl }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Welcome to the Student Feedback System</h2>
      <p style="margin: 0 0 12px;">Hi ${name || 'Lecturer'},</p>
      <p style="margin: 0 0 12px;">
        Your lecturer account has been created. Use the credentials below to log in and update your password.
      </p>
      <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
        <p style="margin: 0 0 8px;"><strong>Username:</strong> ${to}</p>
        <p style="margin: 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
      </div>
      <a href="${loginUrl}" style="display: inline-block; background: #111827; color: #ffffff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">Log in now</a>
      <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">You will be asked to change your password after your first login.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: 'Your Lecturer Feedback System Account',
    html,
  });
};

const sendFeedbackCompletionEmail = async ({ to, name, subjectName, batchLabel, reasonText }) => {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2937;">
      <h2 style="margin-bottom: 8px;">Feedback Period Update</h2>
      <p style="margin: 0 0 12px;">Hi ${name || 'User'},</p>
      <p style="margin: 0 0 12px;">
        Feedback notifications for <strong>${subjectName}</strong> (${batchLabel}).
      </p>
      <p style="margin: 0 0 12px;">${reasonText}</p>
      <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">This is an automated message from the Student Feedback System.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject: `Feedback completed for ${subjectName}`,
    html,
  });
};

module.exports = {
  sendStudentWelcomeEmail,
  sendLecturerWelcomeEmail,
  sendFeedbackCompletionEmail,
};

import nodemailer from 'nodemailer'

// Create a basic email function (update with your SMTP settings)
export const sendEmail = async ({
  to,
  subject,
  html,
  text
}: {
  to: string
  subject: string
  html: string
  text?: string
}) => {
  // For development, just log the email instead of sending
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent:', { to, subject })
    return
  }

  // Add your SMTP configuration here when ready
  console.log('Email sending not configured yet')
}

export const sendWelcomeEmail = async (email: string, name: string) => {
  const html = `
    <h1>Welcome to CalendarSync!</h1>
    <p>Hi ${name}, thanks for signing up!</p>
    <p>Get started by connecting your first calendar.</p>
  `

  await sendEmail({
    to: email,
    subject: 'Welcome to CalendarSync!',
    html,
    text: `Welcome to CalendarSync! Hi ${name}, thanks for signing up!`
  })
}
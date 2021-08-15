import Email from 'email-templates'
import nodemailer from 'nodemailer'
import config from '#config'

// SMTP is the main transport in Nodemailer for delivering messages.
// SMTP is also the protocol used between almost all email hosts, so its truly universal.
// if you dont want to use SMTP you can create your own transport here
// such as an email service API or nodemailer-sendgrid-transport

const transporter = nodemailer.createTransport({
  port: config.email.port,
  host: config.email.host,
  auth: {
    user: config.email.username,
    pass: config.email.password,
  },
  secure: false, // upgrades later with STARTTLS -- change this based on the PORT
})

// verify connection configuration
transporter.verify(error => {
  if (error) {
    console.error('error with email connection')
  }
})

export async function sendPasswordReset(passwordResetObject) {
  const email = new Email({
    views: { root: __dirname },
    message: {
      from: 'support@your-app.com',
    },
    // uncomment below to send emails in development/test env:
    send: true,
    transport: transporter,
  })

  try {
    await email.send({
      template: 'password-reset',
      message: {
        to: passwordResetObject.userEmail,
      },
      locals: {
        productName: 'Test App',
        // passwordResetUrl should be a URL to your app that displays a view where they
        // can enter a new password along with passing the resetToken in the params
        passwordResetUrl: `https://your-app/new-password/view?resetToken=${passwordResetObject.resetToken}`,
      },
    })
  } catch (error) {
    console.error('error sending password reset email:', error)
  }
}

export async function sendEmail(user) {
  const email = new Email({
    views: { root: __dirname },
    message: {
      from: 'support@your-app.com',
    },
    // uncomment below to send emails in development/test env:
    send: true,
    transport: transporter,
  })

  try {
    await email.send({
      template: 'password-change',
      message: {
        to: user.email,
      },
      locals: {
        productName: 'Test App',
        name: user.name,
      },
    })
  } catch (error) {
    console.error('error sending change password email:', error)
  }
}

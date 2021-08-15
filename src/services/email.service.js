import Email from 'email-templates'
import config from '#config'
import transport from '#lib/email'
import logger from '#lib/logger'

export async function sendPasswordReset(passwordResetObject) {
  const email = new Email({
    transport,
    views: { root: config.appPath },
    message: {
      from: 'support@your-app.com',
    },
    // uncomment below to send emails in development/test env:
    send: true,
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
  } catch (err) {
    logger.error({ err, msg: 'error sending password reset email:' })
  }
}

export async function sendEmail(user) {
  const email = new Email({
    transport,
    views: { root: config.appPath },
    message: {
      from: 'support@your-app.com',
    },
    // uncomment below to send emails in development/test env:
    send: true,
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
  } catch (err) {
    logger.error({ err, msg: 'error sending change password email:' })
  }
}

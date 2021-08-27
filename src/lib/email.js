import nodemailer from 'nodemailer'
import config from '#config'

// SMTP is the main transport in Nodemailer for delivering messages.
// SMTP is also the protocol used between almost all email hosts, so its truly universal.
// if you dont want to use SMTP you can create your own transport here
// such as an email service API or nodemailer-sendgrid-transport

const transport = nodemailer.createTransport({
  port: config.email.port,
  host: config.email.host,
  auth: {
    user: config.email.username,
    pass: config.email.password,
  },
  secure: false, // upgrades later with STARTTLS -- change this based on the PORT
})

// TODO:
// export const verifyConnection = promisify(transport.verify)
export const verifyConnection = () => Promise.resolve(true)

export default transport

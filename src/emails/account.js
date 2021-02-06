const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

sendWelcomeEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "omarelweshy@gmail.com",
    subject: "Welcome to App",
    text: `Welcome to the app ${name}.`,
  })
}

sendCancelationEmail = (email, name) => {
  sgMail.send({
    to: email,
    from: "omarelweshy@gmail.com",
    subject: "Good Bye",
    text: `Good Bye from the app ${name}.`,
  })
}

module.exports = {
  sendWelcomeEmail,
  sendCancelationEmail,
}

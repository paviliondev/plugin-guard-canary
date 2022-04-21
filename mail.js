const Mailgun = require('mailgun.js');
const formData = require('form-data');
const path = require("path");
const fsPromises = require('fs').promises;

const key = process.env.MAILGUN_API_KEY;
const domain = 'mg.pavilion.tech';
const mailgun = new Mailgun(formData);
const mailgunClient = mailgun.client({
  username: 'api',
  key,
  url: "https://api.eu.mailgun.net"
});

const from = 'plugin-guard-canary@pavilion.tech';
const to = process.env.MAIL_TO;

async function send(url, message, screenshotPath = null) {
  const data = {
    from,
    to,
    subject: `The canary found smoke on ${url}`,
    text: `This is the error message:\n${message}.\nA screenshot of the issue is attached\nSee more on https://canary.plugins.discourse.pavilion.tech`
  };

  if (screenshotPath) {
    let fileData = await fsPromises.readFile(path.join(__dirname, screenshotPath));
    data.attachment = {
      filename: 'error-screenshot.png',
      data: fileData
    };
  }

  try {
    const result = await mailgunClient.messages.create(domain, data);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

module.exports = {
  send
}

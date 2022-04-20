const path = require("path");
const findRemoveSync = require('find-remove');
const smokeTest = require(path.resolve( __dirname, "./smoke-test.js" ));
const mail = require(path.resolve( __dirname, "./mail.js" ));

module.exports = async function (job) {
  const result = await smokeTest(job.data);

  if (!result.success) {
    mail.send(result.url, result.message, result.screenshotPath);
  }

  // Cleanup
  findRemoveSync(__dirname + './screenshots', {
    age: { seconds: 604800 }, // one week
    extensions: '.png',
  });
  findRemoveSync(__dirname + './logs', {
    age: { seconds: 604800 }, // one week
    extensions: '.log',
  });

  return Promise.resolve(result);
}

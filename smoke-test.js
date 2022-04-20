/*eslint no-console: "off"*/

const chromeLauncher = require("chrome-launcher");
const puppeteer = require("puppeteer-core");
const path = require("path");
const fs = require('fs');

// Modified (and more modular) version of discourse/test/smoke_test.js

const tests = {
  "go to site": (page, data) => {
    return page.goto(data.url);
  },
  "expect a log in button in the header": (page, data) => {
    return page.waitForSelector("header .login-button", { visible: true });
  },
  "open login modal": (page, data) => {
    return page.click(".login-button");
  },
  "login modal is open": (page, data) => {
    return page.waitForSelector(".login-modal", { visible: true });
  },
  "type in credentials & log in": (page, data) => {
    let promise = page.type(
      "#login-account-name",
      data.username
    );

    promise = promise.then(() => {
      return page.type(
        "#login-account-password",
        data.password
      );
    });

    promise = promise.then(() => {
      return page.click(".login-modal .btn-primary");
    });

    return promise;
  },
  "is logged in": (page, data) => {
    return page.waitForSelector(".current-user", { visible: true });
  },
  "go to latest page": (page, data) => {
    return page.goto(path.join(data.url, "latest"));
  },
  "at least one topic shows up": (page, data) => {
    return page.waitForSelector(".topic-list tbody tr", { visible: true });
  },
  "go to categories page": (page, data) => {
    return page.goto(path.join(data.url, "categories"));
  },
  "can see categories on the page": (page, data) => {
    return page.waitForSelector(".category-list", { visible: true });
  },
  "navigate to 1st topic": (page, data) => {
    return page.click(".main-link a.title:first-of-type");
  },
  "at least one post body": (page, data) => {
    return page.waitForSelector(".topic-post", { visible: true });
  },
  "click on the 1st user": (page, data) => {
    return page.click(".topic-meta-data a:first-of-type");
  },
  "user has details": (page, data) => {
    return page.waitForSelector(".user-card .names", { visible: true });
  },
  "go home": (page, data) => {
    let promise = page.waitForSelector("#site-logo, #site-text-logo", {
      visible: true
    });

    promise = promise.then(() => {
      return page.click("#site-logo, #site-text-logo");
    });

    return promise;
  },
  "it shows a topic list": (page, data) => {
    return page.waitForSelector(".topic-list", { visible: true });
  },
  "we have a create topic button": (page, data) => {
    return page.waitForSelector("#create-topic", { visible: true });
  },
  "open composer": (page, data) => {
    return page.click("#create-topic");
  },
  "the editor is visible": (page, data) => {
    return page.waitForFunction(
      "document.activeElement === document.getElementById('reply-title')"
    );
  },
  "check if reply is empty": (page, data) => {
    return page.evaluate(() => {
      document.getElementById("reply-title").value = "";
    });
  },
  "compose new topic": (page, data) => {
    const date = `(${+new Date()})`;
    const title = `This is a new topic ${date}`;
    const post = `I can write a new topic inside the smoke test! ${date} \n\n`;

    let promise = page.type("#reply-title", title);

    promise = promise.then(() => {
      return page.type("#reply-control .d-editor-input", post);
    });

    return promise;
  },
  "updates preview": (page, data) => {
    return page.waitForSelector(".d-editor-preview p", { visible: true });
  },
  "submit the topic": (page, data) => {
    return page.click(".submit-panel .create");
  },
  "topic is created": (page, data) => {
    return page.waitForSelector(".fancy-title", { visible: true });
  },
  "open the composer": (page, data) => {
    return page.click(".post-controls:first-of-type .create");
  },
  "composer is open": (page, data) => {
    return page.waitForSelector("#reply-control .d-editor-input", {
      visible: true
    });
  },
  "compose reply": (page, data) => {
    const post = `I can even write a reply inside the smoke test ;) (${+new Date()})`;
    return page.type("#reply-control .d-editor-input", post);
  },
  "waiting for the preview": (page, data) => {
    return page.waitForXPath(
      "//div[contains(@class, 'd-editor-preview') and contains(.//p, 'I can even write a reply')]",
      { visible: true }
    );
  },
  "wait a little bit": (page, data) => {
    return page.waitFor(5000);
  },
  "submit the reply": (page, data) => {
    let promise = page.click("#reply-control .create");

    promise = promise.then(() => {
      return page.waitForSelector("#reply-control.closed", {
        visible: false
      });
    });

    return promise;
  },
  "reply is created": (page, data) => {
    let promise = page.waitForSelector(
      ".topic-post:not(.staged) #post_2 .cooked",
      {
        visible: true
      }
    );

    promise = promise.then(() => {
      return page.waitForFunction(
        "document.querySelector('#post_2 .cooked').innerText.includes('I can even write a reply')"
      );
    });

    return promise;
  },
  "wait a little bit": (page, data) => {
    return page.waitFor(5000);
  },
  "open composer to edit first post": (page, data) => {
    let promise = page.evaluate(() => {
      window.scrollTo(0, 0);
    });

    promise = promise.then(() => {
      return page.click("#post_1 .post-controls .edit");
    });

    promise = promise.then(() => {
      return page.waitForSelector("#reply-control .d-editor-input", {
        visible: true
      });
    });

    return promise;
  },
  "update post raw in composer": (page, data) => {
    let promise = page.waitFor(5000);

    promise = promise.then(() => {
      return page.type(
        "#reply-control .d-editor-input",
        "\n\nI edited this post"
      );
    });

    return promise;
  },
  "submit the edit": (page, data) => {
    let promise = page.click("#reply-control .create");

    promise = promise.then(() => {
      return page.waitForSelector("#reply-control.closed", {
        visible: false
      });
    });

    return promise;
  },
  "edit is successful": (page, data) => {
    let promise = page.waitForSelector(
      ".topic-post:not(.staged) #post_1 .cooked",
      {
        visible: true
      }
    );

    promise = promise.then(() => {
      return page.waitForFunction(
        "document.querySelector('#post_1 .cooked').innerText.includes('I edited this post')"
      );
    });

    return promise;
  },
  "go to admin panel": (page, data) => {
    return page.goto(path.join(data.url, "admin"));
  },
  "expect the dashboard to appear": (page, data) => {
    return page.waitForSelector(".admin.dashboard", { visible: true });
  },
  "go to admin plugins panel": (page, data) => {
    return page.goto(path.join(data.url, "admin", "plugins"));
  },
  "expect the plugin list to appear": (page, data) => {
    return page.waitForSelector("table.admin-plugins", { visible: true });
  },
  "close browser": (page, data) => {
    return data.browser.close();
  }
}

module.exports = async function (data) {
  data.browser = await puppeteer.launch({
    executablePath: chromeLauncher.Launcher.getInstallations()[0],
    headless: process.env.SHOW_BROWSER === undefined,
    args: ["--no-sandbox"],
  });

  const context = await data.browser.createIncognitoBrowserContext();
  const page = await context.newPage();

  await page.setViewport({
    width: 1366,
    height: 768
  });

  const takeFailureScreenshot = async function() {
    const screenshotPath = `screenshots/smoke-test-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  };

  const logger = fs.createWriteStream(`logs/console-log-${Date.now()}.log`, { flags: 'a' });

  page.on("console", msg => logger.write(`${msg.text()}\n`));

  page.on("response", async resp => {
    if (resp.status() !== 200 && resp.status() !== 302) {
      let message = "FAILED HTTP REQUEST TO " + resp.url() + " Status is: " + resp.status();
      console.log(message);
      return {
        url: data.url,
        success: false,
        message,
        screenshotPath: null
      };
    }
    return resp;
  });

  const exec = (description, fn) => {
    const start = +new Date();

    return fn
      .call(null, page, data)
      .then(async output => {
        let message = `PASSED: ${description} - ${+new Date() - start}ms`;
        return {
          url: data.url,
          success: true,
          message
        };
      })
      .catch(async error => {
        let message = `ERROR (${description}): ${error.message} - ${+new Date() - start}ms`;
        let screenshotPath = await takeFailureScreenshot();
        return {
          url: data.url,
          success: false,
          screenshotPath,
          message
        };
      });
  };

  let testNames = Object.keys(tests);

  for (let index = 0; index < testNames.length; index++) {
    let name = testNames[index];
    let result = await exec(name, tests[name]);

    if (!result.success) {
      console.log(`${name} ×`);
      return result;
    }

    if (index === (testNames.length - 1)) {
      return {
        url: data.url,
        success: true,
        message: "ALL PASSED"
      }
    } else {
      console.log(`${name} ✓`);
    }
  }
}

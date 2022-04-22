## Plugin Guard Canary

The Plugin Guard Canary ("Canary") is a Node.js app that runs a puppeteer script on the Plugin Guard Canary servers. It's a backup, meant to catch anything the Plugin Guard Plugin doesn't catch on those servers.

If the Canary picks up an issue it sends an email with the log and a screenshot to whatever email is set as the `MAIL_TO` environment variable in the `.env` file.

## Adding new tests

If you think an additional test needs to be added to the puppeteer script, please add it to the `tests` list in `smoke-test.js`.

## Features

Main features of the Canary app.

### Jobs

The Puppeteer scripts are managed by [Bull](https://github.com/OptimalBits/bull). The app has a dashboard where the jobs and queues can be managed. Access to the dashboard is protected by GitHub authentication with a GitHub username whitelist: see `authorizedUsers` in app.js.

### Logs

The console logs of each Puppeteer run are captured in a timestamped log file stored in `/logs`. These are rotated every week.

### Screenshots

Screenshots are taken whenever Puppeteer encounters an issue, stored in `screenshots` and attached to the email sent to the `MAIL_TO` recipient. These are also rotated each week.

## Development

How to work with the Canary app in development.

### Dependencies
- Node and NPM
- Redis

### Setup
You need to copy `.env.sample` to `.env` and set the environment variables. Contact Angus for the secrets.

### Run
From the plugin-guard-canary directory run
```
npm install
node app.js
```

## Production

The production Canary app is running on the same server as plugins.discourse.pavilion.tech, with the domain https://canary.plugins.discourse.pavilion.tech.

This repository is cloned at `~/plugin-guard-canary` and the node process is being managed by [pm2](https://github.com/Unitech/pm2). To get the latest code to production, use `git pull`. To start, stop or otherwise manage the app process use the relevant `pm2` command. See https://devhints.io/pm2.

## Plugin Guard Canary

The Plugin Guard Canary ("Canary") is a Node.js app that runs a puppeteer script on the Plugin Guard Canary servers. It's a backup test to catch anything the Plugin Guard Plugin doesn't catch on those servers. If the Canary picks up an issue it sends an email with the log and a screenshot to whatever email is set as the `MAIL_TO` environment variable in the `.env` file.

## Development

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
The production Canary app is running on the same server as plugins.discourse.pavilion.tech, with the domain https://canary.plugins.discourse.pavilion.tech. This repository is cloned at `~/plugin-guard-canary` and the node process is being managed by `pm2`.

To get the latest code to production, use `git pull`. To start, stop or otherwise manage the app process use the relevant `pm2` command. See https://devhints.io/pm2.

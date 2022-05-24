require('dotenv').config();

const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { ensureLoggedIn } = require('connect-ensure-login');
const express = require('express');
const Queue = require('bull');
const { createBullBoard } = require('@bull-board/api');
const { BullAdapter } = require('@bull-board/api/bullAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const serveIndex = require('serve-index');
const path = require("path");

// Setup queues.
const smokeTestQueue = new Queue('smoke test');
smokeTestQueue.process("*", path.resolve( __dirname, "./smoke-test-handler.js" ));

const stableData = {
  url: "https://stable.plugins.discourse.pavilion.tech",
  username: process.env.STABLE_DISCOURSE_USERNAME,
  password: process.env.STABLE_DISCOURSE_PASSWORD
};
const testsPassedData = {
  url: "https://tests-passed.plugins.discourse.pavilion.tech",
  username: process.env.TESTS_PASSED_DISCOURSE_USERNAME,
  password: process.env.TESTS_PASSED_DISCOURSE_PASSWORD
};
const stableJobOpts = {
  attempts: 3,
  timeout: 600000,
  repeat: {
    cron: '15 3 * * *'
  },
  jobId: "stable-smoke-test"
};
const testsPassedJobOpts = {
  attempts: 3,
  timeout: 600000,
  repeat: {
    cron: '15 3 * * *'
  },
  jobId: "tests-passed-smoke-test"
};

smokeTestQueue.getRepeatableJobs().then((jobs) => {
  jobs.forEach((job) => (smokeTestQueue.removeRepeatable(job)));
  smokeTestQueue.add("stable", stableData, stableJobOpts);
  smokeTestQueue.add("tests-passed", testsPassedData, testsPassedJobOpts);
});

const serverAdapter = new ExpressAdapter();
const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [
    new BullAdapter(smokeTestQueue),
  ],
  serverAdapter: serverAdapter
});

serverAdapter.setBasePath('/jobs');

// Setup app

const app = express();
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Setup auth.
const authorizedUsers = [
  'angusmcleod',
  'merefield',
  'communiteq'
];
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: `${process.env.PROTOCOL}://${process.env.DOMAIN}/auth/github/callback`
    },
    function(accessToken, refreshToken, profile, done) {
      let error = null;
      if (!authorizedUsers.includes(profile.username)) {
        error = "Not authorized";
      };
      return done(error, profile);
    }
  )
);
passport.serializeUser((user, cb) => {
  cb(null, user);
});
passport.deserializeUser((user, cb) => {
  cb(null, user);
});
app.use(session({ secret: 'canary secret', saveUninitialized: true, resave: true }));
app.use(passport.initialize({}));
app.use(passport.session({}));

app.get('/', function(req, res){
  res.render('index');
});

app.use('/logs', serveIndex('logs'));
app.use('/logs', express.static('logs'));

app.get('/login', (req, res) => {
  res.render('login', { invalid: req.query.invalid === 'true' });
});

app.post(
  '/login',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  (req, res) => {}
);

app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login?invalid=true' }),
  (req, res) => {
    res.redirect('/jobs');
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
});

app.use('/jobs', ensureLoggedIn({ redirectTo: '/login' }), serverAdapter.getRouter());

const hostname = '127.0.0.1';
const port = 3000;

app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

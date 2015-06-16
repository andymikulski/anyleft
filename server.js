var fs = require('fs'),
  path = require('path'),
  express = require('express'),
  passport = require('passport'),
  morgan = require('morgan'),

  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),

  session = require('express-session'),
  redis = require('redis'),
  client = redis.createClient(11020, 'pub-redis-11020.us-east-1-4.2.ec2.garantiadata.com', {
    auth_pass: 'e5SeXxJHCA8ZmXYw'
  }),
  RedisStore = require('connect-redis')(session),
  sessionStore = new RedisStore({
    'client': client
  }),

  exphbs = require('express-handlebars'),

  LocalStrategy = require('passport-local'),
  TwitterStrategy = require('passport-twitter'),
  GoogleStrategy = require('passport-google'),
  FacebookStrategy = require('passport-facebook'),

  app = express(),
  http = require('http').Server(app),
  io = require('socket.io').listen(http),

  config = require('./config.js'); //config file contains all tokens and other private info
// funct = require('./functions.js'); //funct file contains our helper functions for our Passport and database work


app.set('port', (process.env.PORT || 80));


//===============PASSPORT=================

// Passport session setup.
passport.serializeUser(function(user, done) {
  console.log("serializing " + user.username);
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  console.log("deserializing " + obj);
  done(null, obj);
});

// Use the LocalStrategy within Passport to login users.
passport.use('local-signin', new LocalStrategy({
    passReqToCallback: true
  }, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    done(null, {'displayName': username});
    // funct.localAuth(username, password)
    //   .then(function(user) {
    //     if (user) {
    //       console.log("LOGGED IN AS: " + user.username);
    //       req.session.success = 'You are successfully logged in ' + user.username + '!';
    //       done(null, user);
    //     }
    //     if (!user) {
    //       console.log("COULD NOT LOG IN");
    //       req.session.error = 'Could not log user in. Please try again.'; //inform user could not log them in
    //       done(null, user);
    //     }
    //   })
    //   .fail(function(err) {
    //     console.log(err.body);
    //   });
  }
));

// Use the LocalStrategy within Passport to Register/"signup" users.
passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true
  }, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    done(null, {'displayName': username});
    
    // funct.localReg(username, password)
    //   .then(function(user) {
    //     if (user) {
    //       console.log("REGISTERED: " + user.username);
    //       req.session.success = 'You are successfully registered and logged in ' + user.username + '!';
    //       done(null, user);
    //     }
    //     if (!user) {
    //       console.log("COULD NOT REGISTER");
    //       req.session.error = 'That username is already in use, please try a different one.'; //inform user could not log them in
    //       done(null, user);
    //     }
    //   })
    //   .fail(function(err) {
    //     console.log(err.body);
    //   });
  }
));



// Simple route middleware to ensure user is authenticated.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  req.session.error = 'Please sign in!';
  res.redirect('/signin');
}


//===============EXPRESS=================

// Configure Express
app.use(morgan('dev'));
// app.use(favicon(path.join(__dirname, 'public/favicon.ico')));
app.use(cookieParser());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(methodOverride());
app.use(session({
  secret: 'supersecret',
  name: 'anyleft-sesh',
  store: sessionStore,
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use('/pantry/assets', express.static(path.join(__dirname, 'public/assets')));


// Session-persisted message middleware
app.use(function(req, res, next) {
  var err = req.session.error,
    msg = req.session.notice,
    success = req.session.success;

  delete req.session.error;
  delete req.session.success;
  delete req.session.notice;

  if (err) res.locals.error = err;
  if (msg) res.locals.notice = msg;
  if (success) res.locals.success = success;

  next();
});

// // Configure express to use handlebars templates
var hbs = exphbs({
  'defaultLayout': 'main',
  'extname': '.hbs',
  'layoutsDir': 'source/views/layouts',
  'partialsDir': 'source/views/partials'
});
app.set('views', 'source/views/layouts');
app.engine('.hbs', hbs);
app.set('view engine', '.hbs');

























// setup twitter strat
passport.use(new TwitterStrategy({
    consumerKey: 'lOXOSjorNLgTnjYIwa9ym8xxB',
    consumerSecret: 'iDjBYtaHO8T3LBz6Znpa5MvWJtPmzFLXWcRBxLRQOTORQiDJNC',
    callbackURL: 'http://www.anyleft.co' + (app.get('port') === '80' ? '' : ':' + app.get('port')) + '/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    console.log(['twitter', token, tokenSecret, profile]);

    return done(null, profile);
    // User.findOrCreate({ twitterId: profile.id }, function (err, user) {
    // return done(err, user);
    // });
  }
));

app.get('/auth/twitter', passport.authenticate('twitter'));

app.get('/auth/twitter/callback',
  passport.authenticate('twitter', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });


passport.use(new FacebookStrategy({
    clientID: '1458825857762072',
    clientSecret: 'e403bafa61832e99240d7efbc38710ad',
    callbackURL: 'http://www.anyleft.co' + (app.get('port') === '80' ? '' : ':' + app.get('port')) + '/auth/facebook/callback',
    enableProof: false,
    profileFields: ['id', 'displayName', 'photos']
  },
  function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return done(null, profile);
    // });
  }
));


app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/');
  });

















//===============ROUTES=================
//displays our homepage
app.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('pantry');
  } else {
    res.render('home', {
      user: req.user
    });
  }
});

//displays our signup page
app.get('/log-?in', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('pantry');
  } else {
    res.render('login');
  }
});
app.get('/register', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('pantry');
  } else {
    res.render('register');
  }
});

app.get('/in', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('pantry');
  } else {
    res.render('getin');
  }
});


// route /pantry should be 'Your Pantry'
// so we check if authenticated,
// should check if it's the same user,
// then displays (or redirects if not the same user)
app.get('/pantry+', function(req, res) {
  if (req.isAuthenticated()) {
    res.render('pantry', {
      pantry: {
        'yourPantry': true,
        'user': req.user,
        'id': 123,
        'items': [{
          'id': 111,
          'name': 'Test Product 1',
          'useCount': 0,
          'totalCount': null
        }, {
          'id': 222,
          'name': 'Test Product 2',
          'useCount': 3,
          'totalCount': 6
        }]
      },
      user: req.user
    });
  } else {
    res.redirect('/');
  }
});

// grab specific pantry
// (for sharing)
app.get('/pantry+/:id', function(req, res) {
  res.render('pantry', {
    pantry: {
      'yourPantry': false,
      'user': {
        'username': 'someone_else',
        'displayName': 'Someone Else'
      },
      'id': req.params.id,
      'items': [{
        'id': 333,
        'name': 'Test Product 3',
        'useCount': 5,
        'totalCount': null
      }, {
        'id': 444,
        'name': 'Test Product 4',
        'useCount': 3,
        'totalCount': 6
      }]
    },
    user: req.user
  });
});

//sends the request through our local signup strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/register', passport.authenticate('local-signup', {
  successRedirect: '/',
  failureRedirect: '/signin'
}));

//sends the request through our local login/signin strategy, and if successful takes user to homepage, otherwise returns then to signin page
app.post('/login-please', passport.authenticate('local-signin', {
  successRedirect: '/',
  failureRedirect: '/signin'
}));

//logs user out of site, deleting them from the session, and returns to homepage
app.get('/logout', function(req, res) {
  if (req && req.user) {
    var name = req.user.username;
    console.log("LOGGIN OUT " + req.user.username)
    req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out " + name + "!";
  } else {
    req.logout && req.logout();
    res.redirect('/');
    req.session.notice = "You have successfully been logged out!";
  }
});



app.get('/logout', function(req, res) {
  var name = req.user.username;
  console.log("LOGGIN OUT " + req.user.username)
  req.logout();
  res.redirect('/');
  req.session.notice = "You have successfully been logged out " + name + "!";
});

// 404 route
app.get('/privacy', function(req, res) {
  res.send('todo');
});


// 404 route
app.get('*', function(req, res) {
  res.render('404', {
    user: req.user
  });
});



//==============WEB SOCKETS=============
io.sockets.on('connection', function(socket) {
  console.log('a user connected');

  socket.on('test', function(data) {
    console.log('test : ' + data);
  });
});

//===============PORT=================

http.listen(app.get('port'), function() {
  console.log('listening on *:' + app.get('port'));
});
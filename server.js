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



// redis/db hookups
client.on('error', function(err) {
  console.log('DB Error: ' + err);
});

// client.set('string key', 'string val');
// client.hset('hash key', 'hashtest 1', 'some value', redis.print);
// client.hset(['hash key', 'hashtest 2', 'some other value'], redis.print);
// client.hkeys('hash key', function(err, replies) {
// console.log(replies.length + ' replies:');
// replies.forEach(function (reply, i) {
// console.log('    ' + i + ': ' + reply);
// });
// client.quit();
// });


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

    getMemberAndStuff(username, provider, {
      'username': username,
      'password': password
    }, done);
  }
));

var getMemberAndStuff = function(userID, provider, providedInfo, callback) {
  var storedUser = provider + ':' + userID;

  client.hgetall(provider + ':' + userID, function(err, foundUserInfo) {
    console.log('getasdf', err, foundUserInfo, '\n\n');
    if (!foundUserInfo) {
      console.log('no info; new user\n\n');
      setupMemberStuff(storedUser, providedInfo, callback);
    } else {
      console.log('foundUserInfo', foundUserInfo, '\n');


      client.smembers(storedUser + ':tracked', function(err, trackedItems) {
        console.log('looking for ', storedUser + ':tracked', err, trackedItems);
        if (!trackedItems || !trackedItems.length) {
          console.log('no items found for user ' + foundUserInfo.id);
        } else {
          foundUserInfo.items = trackedItems;
        }
        callback && callback(null, foundUserInfo);
      });

    }
  });
};


var getMemberItems = function(userID, callback) {
  console.log('getMemberItems');
  client.smembers(userID + ':tracked', function(err, trackedItems) {
    if (!trackedItems || !trackedItems.length) {
      console.log('getMemberItems : no items found for user ' + userID);
      callback && callback(null, null);
    } else {
      var getAllItems = client.multi();

      trackedItems.forEach(function(el, index, array) {
        getAllItems.hgetall(el);
      });

      // get all the tracked items
      getAllItems.exec(function(err, replies) {
        callback && callback(null, replies);
      });
    }
  });
};

var setupMemberStuff = function(user, providedInfo, callback) {
  var newMemberInfo = {
    'displayName': providedInfo.displayName,
    'id': user,
    'items': [],
    'username': providedInfo.username || user,
    'password': providedInfo.password,
    'photo': providedInfo.photos && providedInfo.photos.length && providedInfo.photos[0]
  };

  client.hmset(user, newMemberInfo, function(err, res) {
    callback && callback(null, newMemberInfo);
  });
};

// Use the LocalStrategy within Passport to Register/"signup" users.
passport.use('local-signup', new LocalStrategy({
    passReqToCallback: true
  }, //allows us to pass back the request to the callback
  function(req, username, password, done) {
    getMemberAndStuff(username, 'local', {}, done);
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
app.use('/item/assets', express.static(path.join(__dirname, 'public/assets')));


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
    callbackURL: 'http://www.anyleft.co/auth/twitter/callback'
  },
  function(token, tokenSecret, profile, done) {
    console.log(['twitter', token, tokenSecret, profile]);

    getMemberAndStuff(profile.id, 'twitter', profile, done);

    // return done(null, profile);
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
    // res.redirect('/');
  });


passport.use(new FacebookStrategy({
    clientID: '1458825857762072',
    clientSecret: 'e403bafa61832e99240d7efbc38710ad',
    callbackURL: 'http://www.anyleft.co/auth/facebook/callback',
    enableProof: false,
    profileFields: ['id', 'displayName', 'photos']
  },
  function(accessToken, refreshToken, profile, done) {

    getMemberAndStuff(profile.id, 'facebook', profile, done);

    // User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    // return done(null, profile);
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
    res.redirect('/pantry');
  } else {
    res.render('home', {
      user: req.user
    });
  }
});

//displays our signup page
app.get('/log-?in', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/pantry');
  } else {
    res.render('login');
  }
});
app.get('/register', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/pantry');
  } else {
    res.render('register');
  }
});

app.get('/in', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('/pantry');
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


    // get the items
    getMemberItems(req.user.id, function(err, foundItems) {
      res.render('pantry', {
        pantry: {
          'yourPantry': true,
          'user': req.user,
          'id': req.user.id,
          'items': foundItems || []
        },
        user: req.user
      });
    });
  } else {
    res.redirect('/');
  }
});

app.get('/pantry/add', function(req, res) {
  if (req.isAuthenticated()) {
    res.render('pantry-add', {
      user: req.user,
      unitTypes: {
        'unit': 'Container',
        'g': 'Gram',
        'kg': 'Kilogram',
        'lb': 'Pound',
        'ml': 'Milliliter',
        'l': 'Liter',
        'oz': 'Ounce',
        'gal': 'Gallon'
      }
    });
  } else {
    res.redirect('/in');
  }
});

app.post('/pantry/add-item', function(req, res) {
  if (req.isAuthenticated()) {
    var newItemInfo = {
      'user': req.user,
      'name': req.body.name,
      'size': req.body.size,
      'unit': req.body.unit,
      'pings': 0,
      'maxPings': 0,
      'numUses': 0,
      'isDone': false,
      'itemID': (req.user.id + ':' + req.body.name + ':' + req.body.size + ':' + req.body.unit + ':' + Date.now()).replace(/ /g, '-')
    };

    var newItemQueue = client.multi();
    console.log('setting', req.user.id + ':tracked');
    // add it to the list of the user's tracked items
    newItemQueue.sadd(req.user.id + ':tracked', newItemInfo.itemID);

    // set the number key for the number of pings, max pings
    newItemQueue.set(newItemInfo.itemID + ':uses', 0);
    newItemQueue.set(newItemInfo.itemID + ':pings', 0);
    newItemQueue.set(newItemInfo.itemID + ':maxPings', 0);
    // hold the data of the item we're tracking
    newItemQueue.hmset(newItemInfo.itemID, newItemInfo);

    newItemQueue.exec(function(err, response) {
      // if error, redirect back
      if (err) {
        res.redirect('back');
      } else {
        // else we're good so go to the pantry
        res.redirect('/pantry');
      }
    });
  } else {
    res.redirect('/in');
  }
});


app.get('/item/ping/:id', function(req, res) {
  var pingMulti = client.multi(),
    pingInfo = {
      'time': Date.now(),
      'id': req.user.id + ':' + req.params.id + ':ping:' + Date.now()
    };

  pingMulti.zadd(req.params.id + ':pingHistory', Date.now(), pingInfo.id);

  pingMulti.exec(function(err, pingRes) {

    // update ping countns and stuff, then send back to the pantry
    client.incr(req.params.id + ':pings', function(err, reply) {
      client.hset(req.params.id, 'pings', reply, function(err, setReply) {
        res.redirect('/pantry');
      });
    });

  });
});

app.get('/item/done/:id', function(req, res) {
  var multiPings = client.multi(),
    itemId = req.params.id;

  // there is absolutely no way this is correct
  multiPings.get(itemId + ':pings');
  multiPings.get(itemId + ':maxPings');
  multiPings.incr(itemId + ':uses');

  multiPings.exec(function(err, replies) {
    var numPings = replies[0],
      maxPings = replies[1],
      numUses = replies[2];

    var updateMulti = client.multi();

    if (numPings > maxPings) {
      updateMulti.set(itemId + ':maxPings', numPings);
      updateMulti.hset(itemId, 'maxPings', numPings);
    }

    updateMulti.hset(itemId, 'numUses', numUses);
    updateMulti.hset(itemId, 'isDone', true);
    updateMulti.hset(itemId, 'pings', 0);
    updateMulti.set(itemId + ':pings', 0);
    updateMulti.del(itemId + ':pingHistory', 0);


    updateMulti.exec(function(err, updateReply) {
      if (err) {
        console.log('updateMulti err', err);
      }
      res.redirect('/pantry');
    });
  });


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

      // todo: read other user's pantry
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


app.get('/item+/:id', function(req, res) {
  res.send('ok');
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

// needed for fb i think
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
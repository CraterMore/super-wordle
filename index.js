const express = require("express");//Set up the express module
const app = express();
const router = express.Router();
const path = require('path')//Include the Path module
const fetch = require('node-fetch')
const fs = require('node-fs');
var bodyParser = require('body-parser')
const Database = require("@replit/database")
const db = new Database()

const maintenance = false;

const dbTemplate = {
  "1": [],
  "2": [],
  "3": [],
  "4": [],
  "5": [],
  "6": [],
  "gamesPlayed": 0,
  "lastPlay": []
}

const expressSession = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");
const authRouter = require("./auth");

// Session Config

const session = {
  secret: process.env.SESSION_SECRET,
  cookie: {},
  resave: false,
  saveUninitialized: false
};

if (app.get("env") === "production") {
  // Serve secure cookies, requires HTTPS
  session.cookie.secure = true;
}

app.use(express.static(path.join(__dirname, "site")));

app.use(expressSession(session));

passport.use(Auth0Strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Passport Config

const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: process.env.AUTH0_CALLBACK_URL
  },
  function(accessToken, refreshToken, extraParams, profile, done) {
    /**
     * Access tokens are used to authorize users to an API
     * (resource server)
     * accessToken is the token to call the Auth0 API
     * or a secured third-party API
     * extraParams.id_token has the JSON Web Token
     * profile has all the information from the user
     */
    return done(null, profile);
  }
);

// Creating custom middleware with Express
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});

const secured = (req, res, next) => {
  if (req.user) {
    return next();
  }
  req.session.returnTo = req.originalUrl;
  res.redirect("/login");
};

//Set up the Express router

app.get('/site/styles.css', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/styles.css'));
});
app.use('/site/styles.css', router);

app.get('/site/main.js', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/main.js'));
});
app.use('/site/main.js', router);

app.get('/site/submit.js', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/submit.js'));
});
app.use('/site/submit.js', router);

app.get('/site/images/submit.png', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/images/submit.png'));
});
app.use('/site/images/submit.png', router);

app.get('/site/images/home.png', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/images/home.png'));
});
app.use('/site/images/home.png', router);

app.get('/site/images/stats.png', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/images/stats.png'));
});
app.use('/site/images/stats.png', router);

app.get('/site/images/exit.png', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/images/exit.png'));
});
app.use('/site/images/exit.png', router);

app.get('/site/images/logoWhite.png', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/images/logoWhite.png'));
});
app.use('/site/images/logoWhite.png', router);

app.get('/site/images/maintenance.png', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/images/maintenance.png'));
});
app.use('/site/images/maintenance.png', router);

app.use(bodyParser.json());

// Send NYT json to client
app.get("/api/solution", async function(req, res) {
  var today = req.query.today

  const timesRes = await fetch("https://www.nytimes.com/svc/wordle/v2/" + today + ".json")

  if (timesRes.ok) {
    const body = await timesRes.json();

    res.json(body)
  } else {
    res.json({ "Error": "Unable to fetch answer from NYT API." });
  }
})

// Send database information to client
app.post("/api/db", async function(req, res) {
  var userInfo = getUserInfo(req)
  //var userID = req.query.id;

  // Force logout if no retrievable data
  if (!userInfo) {
    console.log("We asked for a redirect")
    res.clearCookie("REPL_AUTH", { domain: `.${req.hostname}` }) // WRONG COOKIE
    res.redirect("back")
    return
  }
  var userID = userInfo.id
  db.get(userID).then(value => {
    if (!value) {
      db.set(userID, dbTemplate)
      res.send(dbTemplate)
    } else {
      res.send(value)
    }
  })
})

// Send user info to client
app.post("/api/getID", async function(req, res) {
  var userInfo = getUserInfo(req)
  //var userID = req.query.id;

  if (!userInfo) {
    res.json("Could not find user info!")
    return
  }
  res.send(userInfo);
})

// Clear REPL_AUTH cookie on client aka logout
app.post("/api/logout", async function(req, res) {
  res.clearCookie("REPL_AUTH", { domain: `.${req.hostname}` })
  res.redirect("back")
  return
})

// Write game progress to Replit Database
app.post("/writeGameProgress", async function(req, res) {
  var today = req.body.date
  var newGuess = req.body.word
  const userID = getUserInfo(req).id

  db.get(userID).then(value => {
    const oldData = value
    const oldLastPlay = oldData["lastPlay"]
    const newData = oldData
    var newLastPlay = []
    if ((oldLastPlay.length == 0) || (oldLastPlay[0] != today)) {
      newLastPlay[0] = today
    } else {
      newLastPlay = oldLastPlay
    }
    newData["lastPlay"] = newLastPlay
    newData["lastPlay"].push(newGuess)
    if (newGuess == req.body.target) {
      var score = (newData["lastPlay"].length) - 1
      newData[score.toString()].push(today)
      newData["gamesPlayed"] = newData["gamesPlayed"] + 1
    } else if (newData["lastPlay"].length == 7) {
      newData["gamesPlayed"] = newData["gamesPlayed"] + 1
    }
    db.set(userID, newData)
    res.send("Success!")
  })
})

// Send submission json to client
router.get("/api/submissions", async function(req, res) {
  res.sendFile(path.join(__dirname, '/submissions.json'))
})

// Send dictionary json to client
router.get("/api/dictionary", async function(req, res) {
  res.sendFile(path.join(__dirname, '/dictionary.json'))
})

// Send targetWords json to client
router.get("/api/targetWords", async function(req, res) {
  res.sendFile(path.join(__dirname, '/targetWords.json'))
})

// Write puzzle to submissions json
app.post("/writePuzzle", async function(req, res) {
  var data = req.body;
  const userInfo = getUserInfo(req)
  var userID
  if (!userInfo) {
    userID = ""
  } else {
    userID = userInfo.id
  }

  fs.readFile("./submissions.json", "utf8", (err, jsonString) => {
    if (err) {
      res.json("Error reading file from disk:", err);
      return;
    }
    const date = data.date
    var obj = JSON.parse(jsonString)
    if (date == null) {
      res.json("Please select a date for your puzzle.")
    } else if (obj[date]) {
      res.json("Selected date already had a word submitted. Choose another date.")
      return
    } else {
      fs.readFile("./dictionary.json", (err, jsonString) => {
        if (err) {
          console.log("File read failed:", err);
          return;
        }
        var dict = JSON.parse(jsonString)
        if (dict.includes(data.word_name[0])) {
          obj[date] = data.word_name
          obj[date].push(userID)
          jsonString = JSON.stringify(obj, null, "\t")
          fs.writeFile('./submissions.json', jsonString, err => {
            if (err) {
                res.json('Error writing file', err)
            } else {
                res.json('Success! Puzzle submitted for ' + date)
            }
          })
        } else {
          res.json("Word must be part of the dictionary.")
          return
        }
      })
    }
  });
})


app.use('/', authRouter);

//Navigate your website
//if they go to '/lol'
router.get('/', secured, async function(req, res) {
  /*var userInfo = getUserInfo(req)
  if (maintenance) {
    if (((userInfo) && (userInfo.id == "9226743")) || (!userInfo)) {
      res.sendFile(path.join(__dirname, '/site/index.html'));
    } else {
      res.sendFile(path.join(__dirname, '/site/maintenance.html'));
    }
  } else {*/
    res.sendFile(path.join(__dirname, '/site/index.html'));
  //}
});

router.get('/lol', function(req, res) {
  res.sendFile(path.join(__dirname, '/lol.html'));
});
app.use('/lol', router);

router.get('/maintenance', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/maintenance.html'));
});
app.use('/maintenance', router);

router.get('/submit', function(req, res) {
  var userInfo = getUserInfo(req)
  if (maintenance) {
    if (((userInfo) && (userInfo.id == "9226743")) || (!userInfo)) {
      res.sendFile(path.join(__dirname, '/site/submit.html'));
    } else {
      res.sendFile(path.join(__dirname, '/site/maintenance.html'));
    }
  } else {
    res.sendFile(path.join(__dirname, '/site/submit.html'));
  }
});
app.use('/submit', router);
//404 Error
app.use(function(req, res, next) {
  res.status(404);
  res.sendFile(__dirname + '/404.html');
});


//set up the Express server to listen on port 3000 and logs some messages when the server is ready
let server = app.listen(8000, function() {
  console.log("App server is running on port 8000");
});
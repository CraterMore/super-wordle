const { getUserInfo } = require("@replit/repl-auth")
const express = require("express");//Set up the express module
const app = express();
const router = express.Router();
const path = require('path')//Include the Path module
const fetch = require('node-fetch')
const fs = require('node-fs');
var bodyParser = require('body-parser')
const Database = require("@replit/database")
const db = new Database()

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

//Set up the Express router

app.get('/site/styles.css', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/styles.css'));
});
app.use('/site/styles.css', router);

app.get('/site/script.js', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/script.js'));
});
app.use('/site/script.js', router);

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

app.get('/site/images/logo.png', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/images/logo.png'));
});
app.use('/site/images/logo.png', router);

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

// Send Replit user information to client
app.get("/__replauthuser", async function(req, res) {
  console.log("DID WE EVEN CALL THIS THING")
  fs.readFile("/__replauthuser", "utf8", (err, jsonString) => {
    if (err) {
      res.json("Error reading file from disk:", err);
      return;
    }
    console.log("We are reading repl auth")
    var obj = jsonString
    console.log(obj)})
  
  if (getUserInfo(req) == null) {
    res.clearCookie("REPL_AUTH", { domain: `.${req.hostname}` })
    res.redirect(303, "/")
    return
  }
  res.sendFile(path.join(__dirname, '/__replauthuser'))
})

// Send database information to client
app.post("/api/db", async function(req, res) {
  var userInfo = getUserInfo(req)
  //var userID = req.query.id;

  if (!userInfo) {
    console.log("We asked for a redirect")
    res.clearCookie("REPL_AUTH", { domain: `.${req.hostname}` })
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

// Send database information to client
app.post("/writeGameProgress", async function(req, res) {
  var dateAPI = new Date()
  var today =
    dateAPI.getFullYear() + '-' +
    String(dateAPI.getMonth() + 1).padStart(2, '0') + '-' +
    String(dateAPI.getDate()).padStart(2, '0');
  
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

// Write puzzle to submissions json
app.post("/writePuzzle", async function(req, res) {
  var data = req.body;
  const userID = getUserInfo(req).id

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


app.use('/', router);

//Navigate your website
//if they go to '/lol'
router.get('/', async function(req, res) {
  res.sendFile(path.join(__dirname, '/site/index.html'));
});

router.get('/lol', function(req, res) {
  res.sendFile(path.join(__dirname, '/lol.html'));
});
app.use('/lol', router);
router.get('/submit', function(req, res) {
  res.sendFile(path.join(__dirname, '/site/submit.html'));
});
app.use('/submit', router);
//404 Error
app.use(function(req, res, next) {
  res.status(404);
  res.sendFile(__dirname + '/404.html');
});


//set up the Express server to listen on port 3000 and logs some messages when the server is ready
let server = app.listen(3000, function() {
  console.log("App server is running on port 3000");
});
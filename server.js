var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure mongoose
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/nytimesnba";
mongoose.connect(MONGODB_URI);

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/nytimesnba", { useNewUrlParser: true });

// Main route (simple Hello World Message)
app.get("/", function (req, res) {
  res.send("Hello world");
});

app.get("/saved", function (req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
/*============================
NOT CURRENTLY WORKING; Cannot read property 'find' of undefined
============================*/
app.get("/all", function (req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function (error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
  // Make a request via axios for the news section of `ycombinator`
  axios.get("https://www.nytimes.com/section/sports/basketball").then(function (response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);
    console.log(response.data)
    // For each element with a "title" class
    $("article").each(function (i, element) {
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("div.story-body")
        .children("a")
        .children("div.story-meta")
        .children("h2")
        .text()
        //Trim white space around beginning & end of title
        .trim()
      result.desc = $(this)
        .children("div.story-body")
        .children("a")
        .children("div.story-meta")
        .children("p.summary")
        .text();
      result.date = $(this)
        .children("footer.story-footer")
        .children("time.dateline")
        .attr("datetime")
      result.link = $(this)
        .children("div.story-body")
        .children("a")
        .attr("href");
      console.log('result: ', result)
      if (result.title && result.desc && result.link && result.date) {
        // Create a new Article using the `result` object built from scraping
        db.Article.create(result)
          .then(function (dbArticle) {
            // View the added result in the console
            console.log("DB ARTICLE:", dbArticle);
          })
          .catch(function (err) {
            // If an error occurred, send it to the client
            return res.json(err);
          });
      }
    });
    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
  });

})

//Find all articles
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//Route for notes
app.get("/notes", function (req, res) {
  // Grab every document in the Articles collection
  db.Note.find({})
    .then(function (dbNote) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbNote);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//Route for notes by ID
app.get("/notes/:id", function (req, res) {
  db.Note.findOne({ _id: req.params.id })
  //.populate("note")
    .then(function (dbNote) {
      res.json(dbNote);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//Update article status to saved
app.put("/articles/:id", function (req, res) {
  db.Article.update({ _id: req.params.id }, { $set: { isSaved: true } })
    .then(function (dbArticle) {
      // If we were able to successfully find saved articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

/*========================
CURRENTLY UNSAVING, BUT NOT BEING RETURNED TO THE INDEX PAGE
TRIED TOGGLING TRUE/FALSE WHICH DIDN'T WORK
========================*/
app.delete("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that updates the matching one in our db...
  db.Article.remove({ _id: req.params.id })

    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

//Find article by specific ID to add note
app.get("/articles/:id", function (req, res) {
  db.Article.findOne({ _id: req.params.id })
  .populate("note")
    .then(function (dbArticle) {
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Save/update an article's note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.delete("/notes/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that updates the matching one in our db...
  db.Note.remove({ _id: req.params.id })

    .then(function (dbNote) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbNote);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
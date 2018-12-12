/*==================
DATA TO LOAD TO PAGE
==================*/

// Create a function to get articles on page load and when scraping
function getArticles() {
    $.getJSON("/articles", function (initialData) {
        console.log(initialData)

        //Filter out duplicate results
        var unsavedArticles = initialData.reduce((unique, o) => {
            if (!unique.some(obj => obj.title === o.title)) {
                unique.push(o);
            }
            return unique;
        }, []);

        //Filter out saved articles
        var data = unsavedArticles.filter(obj => {
            return obj.isSaved === false;
        })
        for (var i = 0; i < data.length; i++) {
            let formattedDate = moment(data[i].date).format("LL")

            //Sort by date
            data.sort(function (a, b) {
                return parseFloat(a.formattedDate) - parseFloat(b.formattedDate);
            });
            $("#articles").append(`
      <h6>${formattedDate}</h6>
      <p data-id="${data[i]._id}"><h4><strong><a href="${data[i].link}" target="_blank">${data[i].title}</a></strong></h4>
      <h5>${data[i].desc}</h5>
      <button data-id="${data[i]._id}"class="btn btn-danger save">Save Article</button></p>
      <div id="${data[i]._id}"></div>
      <br>
      `);
        }
    });
}

//Get articles on page load
getArticles();

//Filter out articles to display only those where "isSaved = true" at saved.html
$.getJSON("/articles", function (data) {
    var savedArticles = data.filter(obj => {
        return obj.isSaved === true;
    })
    console.log('saved:', savedArticles)
    for (var i = 0; i < savedArticles.length; i++) {
        let formattedDate = moment(data[i].date).format("LL")

        //Sort by date
        data.sort(function (a, b) {
            return parseFloat(a.formattedDate) - parseFloat(b.formattedDate);
        });
        $("#saved").append(`
      <h6>${formattedDate}</h6>
      <p data-id="${savedArticles[i]._id}"><h4><strong><a href="${savedArticles[i].link}" target="_blank">${savedArticles[i].title}</a></strong></h4>
      <h5>${savedArticles[i].desc}</h5>
      <button data-id="${savedArticles[i]._id}" data-isSaved=${data[i].isSaved} class="btn btn-danger unsave">Delete Article</button></p>
      <button data-id="${savedArticles[i]._id}" class="btn btn-success viewNotes">View Notes</button>
      <button data-id="${savedArticles[i]._id}" class="btn btn-success addNote">Add Note</button></p>
      <div id="note-${savedArticles[i]._id}"></div>
      <div id="add-note-${savedArticles[i]._id}"></div>
      <br>
      `);
    }
});

/*==================
BUTTON FUNCTIONALITY
==================*/

//View notes for a specific article
$(document).on("click", ".viewNotes", function () {
    //$('#saveArticle').modal('show');
    var thisId = $(this).attr("data-id");
    var thisTitle = $(this).attr("data-card");
    //let thisTitle = this.title
    $("#add-note-" + thisId).empty()
    console.log('clicked view note title', thisTitle);
    $.ajax({
        method: "GET",
        url: "/notes" //+ thisId, used to be articles
    }).then(function (initial) {
            $.ajax({
                method: "GET",
                url: "/articles/" + thisId
            }).then(function (data) {
                console.log('data from note:', data)
                console.log('initial:', initial)
                const result = initial.filter(title => title.noteTitle === data.title);
                console.log('result',result)
                // If there's a note in the article
                // add all notes (seems I can only save one at a time)
                if (!result.length) {
                    $('#note-' + thisId).html(`<div class="card">
                    <div class="card-body">
                      <h5 class="card-title">No Notes Yet</h5>
                      <p class="card-text">Be the first to add a note!</p>
                      <button class="btn btn-dark dismiss" data-id="${thisId}">Dismiss</button></p>
                    </div>
                  </div>`)
                    
                }
                //Indicates that the article doesn't have any notes.
                else {
                    for (let t = 0; t < result.length; t++) {
                        $('#note-' + thisId).append(
                            `<div class="card-${result[t]._id}">
                    <div class="card-body">
                      <h5 class="card-title">${result[t].title}</h5>
                      <p class="card-text">${result[t].body}</p>
                      <button data-id="${result[t]._id}" article-id="${thisId}" class="btn btn-secondary closeNote">Close</button>
                        <button data-id="${result[t]._id}" article-id="${thisId}"class="btn btn-danger deleteNote">Delete Note</button>
                    </div>
                  </div>`)
                        console.log('data.note._id', data.note._id)
                    }

                    
                }
            });
        })
    })

    $(document).on("click", ".closeNote", function () {
        var thisId = $(this).attr("data-id");
        console.log('thisId', thisId)
        $(".card-" + thisId).empty();
    })

    $(document).on("click", ".dismiss", function () {
        var thisId = $(this).attr("data-id");
        $("#note-" + thisId).empty()
    })

    $(document).on("click", "#cancel", function () {
        console.log('cancel clicked')
        var thisId = $(this).attr("data-id");
        $("#add-note-" + thisId).empty();
    })

    $(document).on("click", ".deleteNote", function () {
        var thisId = $(this).attr("data-id");
        var articleId = $(this).attr("article-id");
        console.log('deleting note ID ' + thisId)
        $.ajax({
            method: "DELETE",
            url: "/notes/" + thisId
        })
            .then(function (data) {
                let noteId = data.note
                console.log("NOTE ID:", noteId);
                $('.card-' + thisId).empty();
                //$('#note-' + articleId).empty();
            });
    })

    //Save article to "Saved Articles" page
    $(document).on("click", ".save", function () {
        var thisId = $(this).attr("data-id");
        console.log('clicked save', thisId);
        $.ajax({
            method: "PUT",
            url: "/articles/" + thisId
        })
            .then(function (data) {
                // Log the response
                console.log(data);
                // remove the saved article from the index page
                $("#" + thisId).remove();
                console.log(thisId, ' saved');
                location.reload();
            });
    })

    //Unsave article from "Saved Articles" page
    $(document).on("click", ".unsave", function () {
        var thisId = $(this).attr("data-id");
        console.log('unsaving ' + thisId)
        $.ajax({
            method: "DELETE",
            url: "/articles/" + thisId
        })
            .then(function (data) {
                // Log the response
                console.log(data);
                // remove the article from the saved page
                $("#" + thisId).remove();
                location.reload();
                console.log(thisId, ' unsaved')
            });
    })

    $(document).on("click", ".addNote", function () {
        // Empty the notes from the note section
        var thisId = $(this).attr("data-id");
        console.log('note clicked to add note: ', thisId)
        // Now make an ajax call for the Article
        $.ajax({
            method: "GET",
            url: "/articles/" + thisId
        })
            // Add note information to the page
            .then(function (data) {
                console.log(data);

                $('#note-' + thisId).empty()
                $("#add-note-" + thisId).html(
                    `<div class="card">
        <div class="card-body">
          <h5 class="card-title" data-card='${data.title}'>${data.title}</h5>
          <input id='titleinput' name='title' >
          <textarea id='bodyinput' name='body'></textarea>
          <button data-id='${data._id}' data-title='${data.title}' class="btn btn-success"id='savenote'>Save Note</button>
          <button data-id='${data._id}' class="btn btn-dark" id='cancel'>Cancel</button>
        </div>
      </div>`)
            });
    });

    $(document).on("click", "#savenote", function () {
        // Grab the id associated with the article from the submit button
        var thisId = $(this).attr("data-id");

        // Run a POST request to change the note, using what's entered in the inputs
        $.ajax({
            method: "POST",
            url: "/articles/" + thisId,
            data: {
                noteTitle: $(this).attr('data-title'),
                // Value taken from title input
                title: $("#titleinput").val(),
                // Value taken from note textarea
                body: $("#bodyinput").val()
            }
        })
            // With that done
            .then(function (data) {
                // Log the response
                console.log('saved note data', data);
                // Empty the notes section
                $("#articleNotes").empty();
            });

        // Also, remove the values entered in the input and textarea for note entry
        $("#titleinput").val("");
        $("#bodyinput").val("");
        location.reload()
    });

    $(document).on("click", ".scrape", function () {
        console.log('scrape clicked')
        $.ajax({
            method: "GET",
            url: "/scrape"
        }).then(function () {
            // Log the response
            console.log("scrape complete");
            location.reload();
            getArticles();
        });
    });

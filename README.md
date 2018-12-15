# All the News That's Fit to Scrape

### Overview

This is a web app that lets users view and leave comments on the latest NBA news from the New York Times.

### Technologies

   1. Express

   2. Handlebars

   3. Mongoose

   4. Cheerio

   5. Axios

## Details

  1. Whenever a user visits the site, the app displays stories the New York Times' NBA news section. These scraped articles are saved to the application database, displaying the following information for each article:

     * Headline - the title of the article

     * Summary - a short summary of the article

     * URL - the url to the original article

  2. Users can also leave comments on the articles displayed and revisit them later. The comments are saved to the database as well and associated with their articles (by title). Users can also delete comments left on articles. Stored comments are visible to every user.


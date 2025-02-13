var NodeHelper = require("node_helper");
const axios = require("axios");
const cheerio = require("cheerio");

module.exports = NodeHelper.create({

  start: function() {
    console.log("MMM-Cookidoo node_helper started.");
  },

  // Listen for socket notifications from the frontend.
  socketNotificationReceived: function(notification, payload) {
    console.log("Received notification:", notification, payload);
    if (notification === "GET_RECIPES") {
      this.fetchRecipes(payload);
    }
  },

  fetchRecipes: function(url) {
    var self = this;
    axios.get(url)
      .then(response => {
        const html = response.data;
        const $ = cheerio.load(html);
        const recipes = [];

        // Look for each recipe container. In our example, we use the unique class "bg-body-secondary".
        $("div.bg-body-secondary").each((i, elem) => {
          const $elem = $(elem);

          // Extract the title from the bold recipe link.
          const title = $elem.find("a.fw-bold.recipe-link").text().trim();

         // Extract the recipe link.
	let link = $elem.find("a.fw-bold.recipe-link").attr("href");
	
	// If the link is relative, prepend the base URL.
	if (link && link.startsWith("/")) {
	  link = "https://www.rezeptwelt.de" + link;
	}
	          // Extract the image URL from the first recipe link that contains an image.
          const image = $elem.find("a.recipe-link img").attr("src");

          // Extract the rating from the span with class "rate-amount".
          const rating = $elem.find("span.rate-amount").text().trim();

          // Extract the rating count and remove any parentheses.
          let ratingCount = $elem.find("span.rate-count").text().trim();
          ratingCount = ratingCount.replace(/[()]/g, "");

          // Extract the author from the author link.
          const author = $elem.find("a.text-primary.link--author.author__name").text().trim();

          // Only add the recipe if a title was found.
          if (title) {
            recipes.push({
              title: title,
              link: link,
              image: image,
              rating: rating,
              ratingCount: ratingCount,
              author: author
            });
          }
        });

        console.log("Recipes found:", recipes.length);
        self.sendSocketNotification("RECIPES_RESULT", recipes);
      })
      .catch(error => {
        console.error("Error fetching recipes:", error);
        self.sendSocketNotification("RECIPES_RESULT", []);
      });
  }
});

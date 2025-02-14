const NodeHelper = require("node_helper");
const axios = require("axios");
const cheerio = require("cheerio");

module.exports = NodeHelper.create({
  start: function() {
    console.log("MMM-Cookidoo node_helper started.");
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "GET_RECIPES") {
      this.fetchRecipes(payload);
    } else if (notification === "GET_RECIPE_CONTENT") {
      this.fetchRecipeContent(payload);
    }
  },

  fetchRecipes: function(url) {
    var self = this;
    axios.get(url)
      .then(response => {
        const html = response.data;
        const $ = cheerio.load(html);
        const recipes = [];

        // Example: Loop through recipe containers.
        $("div.bg-body-secondary").each((i, elem) => {
          const $elem = $(elem);
          const title = $elem.find("a.fw-bold.recipe-link").text().trim();
          let link = $elem.find("a.fw-bold.recipe-link").attr("href");
          if (link && link.startsWith("/")) {
            link = "https://www.rezeptwelt.de" + link;
          }
          const image = $elem.find("a.recipe-link img").attr("src");
          const rating = $elem.find("span.rate-amount").text().trim();
          let ratingCount = $elem.find("span.rate-count").text().trim();
          ratingCount = ratingCount.replace(/[()]/g, "");
          const author = $elem.find("a.text-primary.link--author.author__name").text().trim();

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
  },

  fetchRecipeContent: function(url) {
  var self = this;
  axios.get(url)
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);
      
      // Remove unwanted elements
      $('div.d-lg-none, div.accessories.pt-5, div.col.position-relative, div.appliances-list.flex-column.d-flex.gap-3, div.recipe-cooking-today.bg-primary-subtle.py-5.d-flex.flex-column.align-items-center.gap-4').remove();
      
      // Adjust the selector to extract the main recipe content.
      // Change ".recipe-content" to the appropriate container if needed.
      let content = $(".recipe-content").html();
      
      // Fallback to entire body if the specific container is not found.
      if (!content) {
        content = $("body").html();
      }
      
      self.sendSocketNotification("RECIPE_CONTENT_RESULT", content);
    })
    .catch(error => {
      console.error("Error fetching recipe content:", error);
      self.sendSocketNotification("RECIPE_CONTENT_RESULT", "<p>Error fetching content.</p>");
    });
}

});

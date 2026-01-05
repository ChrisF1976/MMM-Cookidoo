const NodeHelper = require("node_helper");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

module.exports = NodeHelper.create({
  start: function () {
    console.log("MMM-Cookidoo node_helper started.");
  },

  socketNotificationReceived: function (notification, payload) {
    // console.log("NodeHelper received socket notification:", notification, payload);

    if (notification === "GET_RECIPES") {
      this.fetchRecipes(payload);
    } else if (notification === "GET_RECIPE_CONTENT") {
      this.fetchRecipeContent(payload);
    } else if (notification === "SAVE_COOKIDOO_LINK") {
      this.saveCookidooLink(payload);
    }
  },

  fetchRecipes: function (url) {
    const self = this;

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.text();
      })
      .then(html => {
        const $ = cheerio.load(html);
        const recipes = [];

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

          const author = $elem
            .find("a.text-primary.link--author.author__name")
            .text()
            .trim();

          if (title) {
            recipes.push({
              title,
              link,
              image,
              rating,
              ratingCount,
              author
            });
          }
        });

        self.sendSocketNotification("RECIPES_RESULT", recipes);
      })
      .catch(err => {
        console.error("Error fetching recipes:", err);
        self.sendSocketNotification("RECIPES_RESULT", []);
      });
  },

  fetchRecipeContent: function (url) {
    const self = this;

    fetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.text();
      })
      .then(html => {
        const $ = cheerio.load(html);

        // Remove unwanted elements
        $(
          "div.d-lg-none, " +
          "div.accessories.pt-5, " +
          "div.col.position-relative, " +
          "div.appliances-list.flex-column.d-flex.gap-3, " +
          "div.recipe-cooking-today.bg-primary-subtle.py-5.d-flex.flex-column.align-items-center.gap-4"
        ).remove();

        let content = $(".recipe-content").html();
        if (!content) {
          content = $("body").html();
        }

        self.sendSocketNotification("RECIPE_CONTENT_RESULT", content);
      })
      .catch(err => {
        console.error("Error fetching recipe content:", err);
        self.sendSocketNotification(
          "RECIPE_CONTENT_RESULT",
          "<p>Error fetching content.</p>"
        );
      });
  },

  // Save the Cookidoo link to a file named "cookidoo.link" in the MMM-Cookidoo folder.
  saveCookidooLink: function (link) {
    const filePath = path.join(__dirname, "cookidoo.link");

    fs.writeFile(filePath, link, err => {
      if (err) {
        console.error("Error saving Cookidoo link:", err);
      }
    });
  }
});

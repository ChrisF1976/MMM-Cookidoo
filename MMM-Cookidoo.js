Module.register("MMM-Cookidoo", {

  // Default module configuration.
  defaults: {
    updateInterval: 60 * 60 * 1000,  // Update recipes every 1 hour.
    rotateInterval: 10 * 1000,         // Rotate displayed recipe every 10 seconds.
    apiURL: "https://www.rezeptwelt.de/rezepte/rezeptedestages/liste",
    imageWidth: "100%",              // Recipe image width (e.g., "400px" or "100%")
    showRecipeLink: true,            // true to show "View Recipe" link, false to hide
    showCookidoo: true,              // true to show the Cookidoo container, false to hide
    showRating: true,                // true to show the rating with stars, false to hide
    moduleWidth: "600px",            // Module width (applied to outer wrapper)
  },

  // Load Iconify for the star icons.
  getScripts: function() {
    return ["https://code.iconify.design/2/2.0.4/iconify.min.js"];
  },

  notificationReceived: function (notification, payload, sender) {
    if (notification === "Cookidoo_view") {
      // Suche den Link mit der Klasse "recipe-link" und simuliere einen Klick.
      const viewLink = document.querySelector(".recipe-link");
      if (viewLink) {
        viewLink.click();
      } else {
        Log.error("View Recipe Link nicht gefunden.");
      }
    } else if (notification === "Cookidoo_add") {
      // Suche den Link innerhalb des Cookidoo Containers und simuliere einen Klick.
      const addLink = document.querySelector(".cookidoo-link");
      if (addLink) {
        addLink.click();
      } else {
        Log.error("Cookidoo Add Link nicht gefunden.");
      }
    }
  },

  start: function() {
    Log.info("Starting module: " + this.name);
    this.recipes = [];
    this.currentIndex = 0;

    // Request recipes from the node helper.
    this.sendSocketNotification("GET_RECIPES", this.config.apiURL);

    // Refresh recipes periodically.
    setInterval(() => {
      this.sendSocketNotification("GET_RECIPES", this.config.apiURL);
    }, this.config.updateInterval);

    // Rotate the displayed recipe.
    setInterval(() => {
      this.rotateRecipe();
    }, this.config.rotateInterval);
  },

  rotateRecipe: function() {
    if (this.recipes.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % this.recipes.length;
      this.updateDom();
    }
  },

  socketNotificationReceived: function(notification, payload) {
    if (notification === "RECIPES_RESULT") {
      this.recipes = payload;
      this.currentIndex = 0;
      this.updateDom();
    }
  },

  // Load the module's CSS file.
  getStyles: function() {
    return ["MMM-Cookidoo.css"];
  },

  // Build the DOM to display a recipe.
  getDom: function() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-Cookidoo";
    
    // Apply module dimensions from config.
    if (this.config.moduleWidth) {
      wrapper.style.width = this.config.moduleWidth;
    }

    if (this.recipes.length === 0) {
      wrapper.innerHTML = "Loading recipes...";
      return wrapper;
    }
  
    const recipe = this.recipes[this.currentIndex];

    // Headline
    const headline = document.createElement("div");
    headline.className = "recipe-headline";
    headline.innerHTML = recipe.title;
    wrapper.appendChild(headline);

    // Recipe image.
    if (recipe.image) {
      const img = document.createElement("img");
      img.src = recipe.image;
      img.alt = recipe.title;
      if (this.config.imageWidth) {
        img.style.width = this.config.imageWidth;
      }
      wrapper.appendChild(img);
    }

    // Rating container.
    if (this.config.showRating) {
      const ratingContainer = document.createElement("div");
      ratingContainer.className = "rating-container";
      let ratingNum = parseInt(recipe.rating);
      if (isNaN(ratingNum)) { ratingNum = 0; }
      for (let i = 0; i < ratingNum; i++) {
        const star = document.createElement("span");
        star.className = "iconify";
        star.setAttribute("data-icon", "noto:star");
        star.setAttribute("data-inline", "false");
        ratingContainer.appendChild(star);
      }
      const ratingText = document.createElement("span");
      ratingText.className = "rating-text";
      ratingText.innerHTML = ` ${recipe.rating}/5`;
      ratingContainer.appendChild(ratingText);
      wrapper.appendChild(ratingContainer);
    }

    // Recipe link.
    let recipeLink = recipe.link;
    if (recipeLink && recipeLink.startsWith("/")) {
      recipeLink = "https://www.rezeptwelt.de" + recipeLink;
    }
    if (this.config.showRecipeLink) {
      const link = document.createElement("a");
      link.className = "recipe-link";
      link.href = recipeLink;
      link.target = "_blank";
      link.innerHTML = "View Recipe";
      wrapper.appendChild(link);
   
    }

    // Cookidoo container.
    if (this.config.showCookidoo) {
      const cookidooContainer = document.createElement("div");
      cookidooContainer.className = "cookidoo-container";
      cookidooContainer.innerHTML = `
        <a target="_blank" href="https://cookidoo.de/created-recipes/de-DE/add-to-cookidoo?partnerId=rezeptwelt-b20807&amp;recipeUrl=${encodeURIComponent(recipeLink)}" class="cookidoo-link">
          <img src="https://assets.cookidoo.io/a2c/assets/logo_tm_white.svg" class="logo" alt="TM6 logo">
          <div class="text-container-simple-widget">
            <div class="text-container-inner">
              <span class="main-text-block">Zu&nbsp;Cookidoo<span class="registered-sign">®</span></span>
              <span class="suffix text-addition">hinzufügen</span>
            </div>
          </div>
        </a>
      `;
      wrapper.appendChild(cookidooContainer);
      
    }

    if (window.Iconify) {
      Iconify.scan(wrapper);
    }

    return wrapper;
  }
});

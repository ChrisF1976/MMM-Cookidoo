Module.register("MMM-Cookidoo", {
  // Default module configuration.
  defaults: {
    updateInterval: 60 * 60 * 1000,  // Update recipes every 1 hour.
    rotateInterval: 10 * 1000,        // Rotate displayed recipe every 10 seconds.
    apiURL: "https://www.rezeptwelt.de/rezepte/rezeptedestages/liste",
    imageWidth: "100%",
    showRecipeLink: true,
    showCookidoo: true,
    showRating: true,
    moduleWidth: "600px",
  },

  getScripts: function() {
    return ["https://code.iconify.design/2/2.0.4/iconify.min.js"];
  },

  notificationReceived: function (notification, payload, sender) {
  if (notification === "Cookidoo_view") {
    const viewLink = document.querySelector(".recipe-link");
    if (viewLink) {
      this.sendSocketNotification("GET_RECIPE_CONTENT", viewLink.href);
    } else {
      Log.error("View Recipe Link not found.");
    }
  } else if (notification === "Cookidoo_add") {
    const addLink = document.querySelector(".cookidoo-link");
    if (addLink) {
      addLink.click();
    } else {
      Log.error("Cookidoo Add Link not found.");
    }
  } else if (notification === "Cookidoo_view_close") {
    // Close the modal if it exists.
    const modal = document.getElementById("view-modal");
    if (modal) {
      modal.remove();
    }
  }
},


  socketNotificationReceived: function(notification, payload) {
    if (notification === "RECIPES_RESULT") {
      this.recipes = payload;
      this.currentIndex = 0;
      this.updateDom();
    } else if (notification === "RECIPE_CONTENT_RESULT") {
      // Display the fetched HTML content in a modal.
      this.showViewModal(payload);
    }
  },

  showViewModal: function(content) {
    if (document.getElementById("view-modal")) {
      return;
    }

    const modal = document.createElement("div");
    modal.id = "view-modal";
    modal.className = "view-modal";

    const modalContent = document.createElement("div");
    modalContent.className = "view-modal-content";

    const closeButton = document.createElement("span");
    closeButton.className = "view-modal-close";
    closeButton.innerHTML = "&times;";
    closeButton.onclick = function() {
      modal.remove();
    };

    const contentContainer = document.createElement("div");
    contentContainer.className = "view-modal-inner-content";
    contentContainer.innerHTML = content;

    modalContent.appendChild(closeButton);
    modalContent.appendChild(contentContainer);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
  },

  start: function() {
    Log.info("Starting module: " + this.name);
    this.recipes = [];
    this.currentIndex = 0;

    this.sendSocketNotification("GET_RECIPES", this.config.apiURL);

    setInterval(() => {
      this.sendSocketNotification("GET_RECIPES", this.config.apiURL);
    }, this.config.updateInterval);

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

  getStyles: function() {
    return ["MMM-Cookidoo.css"];
  },

  getDom: function() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-Cookidoo";

    if (this.config.moduleWidth) {
      wrapper.style.width = this.config.moduleWidth;
    }

    if (this.recipes.length === 0) {
      wrapper.innerHTML = "Loading recipes...";
      return wrapper;
    }

    const recipe = this.recipes[this.currentIndex];

    const headline = document.createElement("div");
    headline.className = "recipe-headline";
    headline.innerHTML = recipe.title;
    wrapper.appendChild(headline);

    if (recipe.image) {
      const img = document.createElement("img");
      img.src = recipe.image;
      img.alt = recipe.title;
      if (this.config.imageWidth) {
        img.style.width = this.config.imageWidth;
      }
      wrapper.appendChild(img);
    }

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

    // "View Recipe" link that will trigger the modal.
    let recipeLink = recipe.link;
    if (recipeLink && recipeLink.startsWith("/")) {
      recipeLink = "https://www.rezeptwelt.de" + recipeLink;
    }
    if (this.config.showRecipeLink) {
      const link = document.createElement("a");
      link.className = "recipe-link";
      link.href = recipeLink;
      link.innerHTML = "View Recipe";
      // Prevent default navigation.
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.sendSocketNotification("GET_RECIPE_CONTENT", recipeLink);
      });
      wrapper.appendChild(link);
    }

    // Cookidoo container (opens normally).
    if (this.config.showCookidoo) {
      const cookidooContainer = document.createElement("div");
      cookidooContainer.className = "cookidoo-container";
      
      const cookidooLink = document.createElement("a");
      cookidooLink.className = "cookidoo-link";
      cookidooLink.href = "https://cookidoo.de/created-recipes/de-DE/add-to-cookidoo?partnerId=rezeptwelt-b20807&recipeUrl=" + encodeURIComponent(recipeLink);
      cookidooLink.target = "_blank";
      cookidooLink.innerHTML = `
        <img src="https://assets.cookidoo.io/a2c/assets/logo_tm_white.svg" class="logo" alt="TM6 logo">
        <div class="text-container-simple-widget">
          <div class="text-container-inner">
            <span class="main-text-block">Zu&nbsp;Cookidoo<span class="registered-sign">®</span></span>
            <span class="suffix text-addition">hinzufügen</span>
          </div>
        </div>
      `;
      cookidooContainer.appendChild(cookidooLink);
      wrapper.appendChild(cookidooContainer);
    }

    if (window.Iconify) {
      Iconify.scan(wrapper);
    }

    return wrapper;
  }
});

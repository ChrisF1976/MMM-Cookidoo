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
    moduleWidth: "400px",
    showQR: true,            // If true, display an inline QR-code next to the Cookidoo link.
    qrSize: "50x50"         // Size for the inline QR-code (e.g., "50x50")
  },

  getScripts: function() {
    return ["https://code.iconify.design/2/2.0.4/iconify.min.js"];
  },

  notificationReceived: function(notification, payload, sender) {
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
        console.log("Cookidoo link: " + addLink.href);
        // Open the link in a new tab.
        window.open(addLink.href, '_blank');
        // Save the link via the node helper.
        this.sendSocketNotification("SAVE_COOKIDOO_LINK", addLink.href);
        // show QR modal
        this.showQrCodeModal(addLink.href);
      } else {
        Log.error("Cookidoo Add Link not found.");
      }
    } else if (notification === "Cookidoo_view_close") {
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
      this.showViewModal(payload);
    }
  },

  // Function to show the QR modal (with fixed size 200x200)
  showQrCodeModal: function(link) {
    // Remove any existing modal.
    let existingModal = document.getElementById("qr-modal");
    if (existingModal) {
      existingModal.remove();
    }
    const modal = document.createElement("div");
    modal.id = "qr-modal";
    // Basic inline styles; detailed styling is in the CSS.
    modal.style.position = "fixed";
    modal.style.zIndex = "10000";
    modal.style.left = "50%";
    modal.style.top = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.backgroundColor = "rgba(255,255,255,0.95)";
    modal.style.border = "1px solid #888";
    modal.style.padding = "20px";
    modal.style.boxShadow = "0 2px 10px rgba(0,0,0,0.5)";
    modal.style.textAlign = "center";
    // Create headline.
    const heading = document.createElement("h3");
    heading.textContent = "Cookidoo link";
    modal.appendChild(heading);
    // Generate QR code image (fixed size 200x200).
    const img = document.createElement("img");
    const qrUrl = "https://api.qrserver.com/v1/create-qr-code/?data=" +
                  encodeURIComponent(link) + "&size=200x200";
    img.src = qrUrl;
    img.alt = "QR Code for Cookidoo link";
    modal.appendChild(img);
    document.body.appendChild(modal);
    // Auto-close modal after 1 minute.
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 60000);
  },

  // Original modal for viewing recipe content.
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
    // "View Recipe" link.
    let recipeLink = recipe.link;
    if (recipeLink && recipeLink.startsWith("/")) {
      recipeLink = "https://www.rezeptwelt.de" + recipeLink;
    }
    if (this.config.showRecipeLink) {
      const link = document.createElement("a");
      link.className = "recipe-link";
      link.href = recipeLink;
      link.innerHTML = "View Recipe";
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.sendSocketNotification("GET_RECIPE_CONTENT", recipeLink);
      });
      wrapper.appendChild(link);
    }
    // Cookidoo container.
    if (this.config.showCookidoo) {
      const cookidooContainer = document.createElement("div");
      cookidooContainer.className = "cookidoo-container";
      // Create a wrapper for both the cookidoo link and the inline QR.
      const linkWrapper = document.createElement("div");
      linkWrapper.style.display = "flex";
      linkWrapper.style.alignItems = "baseline";
      linkWrapper.style.justifyContent = "center";
      
      const cookidooLink = document.createElement("a");
      cookidooLink.className = "cookidoo-link";
      cookidooLink.href = "https://cookidoo.de/created-recipes/de-DE/add-to-cookidoo?partnerId=rezeptwelt-b20807&recipeUrl=" +
                           encodeURIComponent(recipeLink);
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
      // Attach a click listener to save the link on manual click.
      cookidooLink.addEventListener("click", (e) => {
        console.log("Manual Cookidoo link click. Saving link.");
        this.sendSocketNotification("SAVE_COOKIDOO_LINK", cookidooLink.href);
      });
      linkWrapper.appendChild(cookidooLink);
      
      // If enabled, add the inline QR code.
      if (this.config.showQR) {
        const qrImg = document.createElement("img");
        const inlineQrUrl = "https://api.qrserver.com/v1/create-qr-code/?data=" +
                            encodeURIComponent(cookidooLink.href) +
                            "&size=" + this.config.qrSize;
        qrImg.src = inlineQrUrl;
        qrImg.alt = "Inline QR Code";
        qrImg.style.marginLeft = "15px";
        // When the inline QR is clicked, show the larger QR modal.
        qrImg.style.cursor = "pointer";
	qrImg.className = "inline-qr";
        qrImg.addEventListener("click", () => {
          this.showQrCodeModal(cookidooLink.href);
        });
        linkWrapper.appendChild(qrImg);
      }
      cookidooContainer.appendChild(linkWrapper);
      wrapper.appendChild(cookidooContainer);
    }
    if (window.Iconify) {
      Iconify.scan(wrapper);
    }
    return wrapper;
  }
});

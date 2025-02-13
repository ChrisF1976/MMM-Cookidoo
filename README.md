# MMM-Cookidoo

MMM-Cookidoo is a MagicMirror² module that fetches and displays random recipes from [rezeptwelt.de](https://www.rezeptwelt.de/rezepte/rezeptedestages/liste). It rotates through the recipes, showing details like the title, image, and rating. The module also provides clickable links for viewing the full recipe and for adding the recipe to Cookidoo. Additionally, it supports notifications to trigger virtual clicks on these links.

!(

## Features

- **Recipe Fetching:** Scrapes recipes from rezeptwelt.de using Axios and Cheerio.
- **Auto-Rotation:** Rotates the displayed recipe every 10 seconds.
- **Periodic Updates:** Refreshes the recipe list every hour.
- **Display Elements:** Shows the recipe title, image, and rating (with star icons via Iconify).
- **Interactive Links:** Provides a "View Recipe" link and a "Zu Cookidoo hinzufügen" link.
- **Notification Handling:** Listens for `Cookidoo_view` and `Cookidoo_add` notifications to simulate virtual clicks on the respective links.

## Installation

1. **Clone the Repository:**

   Navigate to your MagicMirror `modules` directory and clone the repository:

   ```
   cd ~/MagicMirror/modules
   git clone https://github.com/yourusername/MMM-Cookidoo.git
   ```

2. **Install Dependencies:**

```
cd MMM-Cookidoo
npm install
```

## Configuration

To configure the module, add it to your MagicMirror `config/config.js` file:
```
{
  module: "MMM-Cookidoo",
  position: "top_right",  // Adjust position as needed
  config: {
    updateInterval: 60 * 60 * 1000,  // Update recipes every 1 hour
    rotateInterval: 5 * 60 * 1000,   // Rotate displayed recipe every 5 minutes
    apiURL: "https://www.rezeptwelt.de/rezepte/rezeptedestages/liste",
    imageWidth: "250px",              // Recipe image width (e.g., "250px" or "100%")
    showRecipeLink: true,            // Display "View Recipe" link
    showCookidoo: true,              // Display the Cookidoo container link
    showRating: true,                // Display the rating with stars
    moduleWidth: "400px",            // Module width (applied to outer wrapper)
  }
},
```

## Interactive Notifications:
The module listens for the following notifications:
- Cookidoo_view: Simulates a click on the "View Recipe" link.
- Cookidoo_add: Simulates a click on the Cookidoo container link.
To trigger these notifications from another module or custom script, use:
```
this.sendNotification("Cookidoo_view");
// or
this.sendNotification("Cookidoo_add");
```

## Files

- **MMM-Cookidoo.js**  
  The main frontend module file which handles displaying the recipes and listening to notifications.

- **node_helper.js**  
  The backend helper which scrapes recipes from the website using Axios and Cheerio.

- **MMM-Cookidoo.css**  
  The stylesheet for customizing the look of the module.

- **package.json**  
  Lists dependencies (axios and cheerio) and other project metadata.

## License

This project is licensed under the MIT License.

## Author

ChrisF1976

# Shoply — Dynamic JavaScript DOM Logic & RESTful API Client

A responsive product catalog built with HTML, CSS and vanilla JavaScript (ES6 modules). It uses the public [Fake Store API](https://fakestoreapi.com/) to load live product data.

## Features

- Fetches products and categories with `async/await` and `fetch()`.
- Live search filters products without reloading the page.
- Category tabs and sorting (featured, price, rating, name).
- Shopping bag with add/remove actions and subtotal calculation.
- Cart and filter preferences saved in `localStorage`.
- Loading skeletons, error message and retry button.
- Responsive layout for desktop, tablet and mobile.
- JavaScript split into modular files: `app.js`, `api.js`, and `storage.js`.

## Run the project

Because this project uses JavaScript ES modules and `fetch`, run it through a local web server (do not open `index.html` directly with `file://`).

### Option 1: VS Code Live Server
1. Extract the ZIP file.
2. Open the extracted `dynamic-rest-api-client` folder in VS Code.
3. Install the **Live Server** extension if you do not already have it.
4. Right-click `index.html` and choose **Open with Live Server**.
5. The site should open in your browser. Make sure you have an internet connection.

### Option 2: Python local server
If Python is installed, open a terminal in the project folder and run:
```bash
python -m http.server 5500
```
Then visit `http://localhost:5500`.

## Project structure

```text
dynamic-rest-api-client/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── api.js
│   ├── app.js
│   └── storage.js
└── README.md
```

## API endpoints

- `GET https://fakestoreapi.com/products`
- `GET https://fakestoreapi.com/products/categories`

## Notes

- Product information is fetched from the external API at runtime; an internet connection is required.
- The cart is a front-end demo only. It does not process payments or create real orders.
- The project uses no framework or build step, so the source is easy to inspect and submit in a GitHub repository.

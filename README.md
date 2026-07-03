# msi-product-scraper

A web scraper built with **Playwright** and **TypeScript** that extracts product information from an MSI product page and saves the data as a structured JSON file.

## Features

The scraper extracts the following information:

- Product URL
- Product ID
- Product title
- Brand
- Product category
- Category tree (breadcrumbs)
- Product description
- Price
- Sale price (if available)
- Availability
- Main product image
- Additional product images
- Technical specifications
- Average star rating
- Review count
- GTIN (if available)
- Manufacturer Part Number (MPN)
- Scraping timestamp (ISO 8601)

The scraped data is saved to:

```text
output/product.json
```

---

## Tech Stack

- TypeScript
- Playwright
- Node.js

---

## Installation

Clone the repository:

```bash
git clone https://github.com/lkovbasiuk/msi-product-scraper.git
cd msi-product-scraper
```

Install the project dependencies:

```bash
npm install
```

Install the Chromium browser required by Playwright:

```bash
npx playwright install chromium
```

---

## Usage

Run the scraper:

```bash
npm run scrape
```

After the scraper finishes, the extracted product data will be saved to:

```text
output/product.json
```

## Running the Scraper

Run the scraper with:

```bash
npx tsx src/scrape.ts
```

After the scraper finishes, the extracted product data will be available in:

```text
output/product.json
```

---

## Project Structure

```text
.
├── output/
│   └── product.json
├── src/
│   └── scrape.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Output Example

```json
{
  "url": "https://us-store.msi.com/Motherboards/Intel-Platform-Motherboard/INTEL-Z890/MAG-Z890-TOMAHAWK-WIFI",
  "item_id": "MAG-Z890-TOMAHAWK-WIFI",
  "title": "MAG Z890 TOMAHAWK WIFI",
  "brand": "MSI",
  "product_category": "Motherboards > Intel Platform Motherboard > INTEL Z890",
  "price": 299.99,
  "sale_price": null,
  "availability": "in_stock",
  "image_url": "https://asset-us-store.msi.com/image/...",
  "scraped_at": "2026-07-03T18:15:21.645Z"
}
```

---

## Notes

- The scraper is currently configured to scrape a single MSI product page.
- Fields such as `sale_price` and `gtin` are returned as `null` when they are not available.
- The `output` directory is created automatically if it does not exist.
- Running the scraper again will overwrite the existing `output/product.json` file with fresh data.

---

## License

This project is licensed under the ISC License.
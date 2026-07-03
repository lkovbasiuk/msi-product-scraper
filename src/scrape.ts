import { chromium } from 'playwright';
import fs from 'fs/promises';

const targetUrl =
  'https://us-store.msi.com/Motherboards/Intel-Platform-Motherboard/INTEL-Z890/MAG-Z890-TOMAHAWK-WIFI';

type CategoryTreeItem = {
  name: string;
  url: string | null;
};

type Spec = {
  key: string;
  value: string;
};

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(targetUrl);
  await page
    .locator("button:has-text('Accept')")
    .click()
    .catch(() => {});

  await page.waitForTimeout(5000);

  const url: string = page.url();

  let item_id: string | null = null;
  const urlSlug = new URL(targetUrl).pathname.split('/').pop();
  if (urlSlug) {
    item_id = urlSlug;
  }

  const title: string | null = await page
    .locator('h2.crop-text-2.title')
    .first()
    .textContent();

  const brand: string | null = await page
    .locator("meta[property='og:site_name']")
    .getAttribute('content')
    .catch(() => 'MSI');

  const crumbs = await page.locator('.breadcrumb-item').allTextContents();
  const product_category: string | null = crumbs
    .map((c) => c.trim())
    .filter((c) => c && c !== 'Home')
    .slice(0, -1)
    .join(' > ');

  const category_tree: CategoryTreeItem[] = await page.$$eval(
    '.breadcrumb-item',
    (items) => {
      return items
        .map((el) => {
          const a = el.querySelector('a');

          return {
            name: (a ? a.textContent : el.textContent).trim(),
            url: a ? a.href : null,
          };
        })
        .filter((item) => item.name && item.name !== 'Home')
        .slice(0, -1);
    }
  );

  const descriptionRaw = await page
    .locator('p')
    .filter({ hasText: 'MAG Z890 TOMAHAWK WIFI' })
    .first()
    .textContent()
    .catch(() => null);
  const description: string | null = descriptionRaw
    ? descriptionRaw.trim().replace(/\s+/g, ' ')
    : null;

  const priceText = await page
    .locator('#prices-new')
    .first()
    .textContent()
    .catch(() => null);

  const price: number | null = priceText
    ? Number(priceText.replace(/[^\d.]/g, ''))
    : null;

  const oldPrice = await page
    .locator('.price-old, del')
    .textContent()
    .catch(() => null);
  const newPrice = await page
    .locator('.prices-new, .price-new')
    .textContent()
    .catch(() => null);

  let sale_price: number | null = null;

  if (oldPrice && newPrice && oldPrice !== newPrice) {
    sale_price = Number(newPrice.replace(/[^\d.]/g, ''));
  }

  const bodyText = await page.textContent('body');

  let availability: string | null = null;

  if (bodyText?.includes('In Stock')) {
    availability = 'in_stock';
  } else if (bodyText?.includes('Out of Stock')) {
    availability = 'out_of_stock';
  } else if (bodyText?.includes('Pre-Order')) {
    availability = 'pre_order';
  }

  const image_url: string | null = await page
    .locator('#imagePopup')
    .getAttribute('src')
    .catch(() => null);

  const all_image_urls = await page.$$eval(
    '#carouselImages img',
    (imgs): string[] => {
      const urls = imgs
        .map((img) => img.getAttribute('popup_img'))
        .filter((url): url is string => url !== null);

      return Array.from(new Set(urls));
    }
  );

  const additional_image_urls: string[] = all_image_urls.filter(
    (url) => url !== image_url
  );

  const specs: Spec[] = await page.$$eval('table tr', (rows) => {
    return rows
      .map((row) => {
        const keyEl = row.querySelector('th');
        const valueEl = row.querySelector('td');

        if (!keyEl || !valueEl) return null;

        const key = keyEl.textContent?.trim();
        const value = valueEl.textContent?.trim();

        if (!key || !value) return null;

        return {
          key,
          value: value.replace(/\s+/g, ' '),
        };
      })
      .filter(Boolean) as Spec[];
  });

  const raw = await page
    .locator('#average-rating-info')
    .first()
    .textContent()
    .catch(() => null);

  let star_rating: number | null = null;
  let review_count: number | null = null;

  if (raw) {
    const ratingMatch = raw.match(/(\d+(\.\d+)?)/);
    star_rating = ratingMatch ? Number(ratingMatch[0]) : null;

    const countMatch = raw.match(/\((\d+)\)/);
    review_count = countMatch ? Number(countMatch[1]) : null;
  }

  const gtin: string | null = await page.evaluate(() => {
    const scripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );

    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');

        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (item.gtin13) return item.gtin13;
          if (item.gtin14) return item.gtin14;
          if (item.gtin12) return item.gtin12;
          if (item.upc) return item.upc;
          if (item.ean) return item.ean;
        }
      } catch {
        // JSON-LD parse error ignored
      }
    }

    return null;
  });

  const mpn: string | null = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('table tr'));

    for (const row of rows) {
      const th = row.querySelector('th');
      const td = row.querySelector('td');

      if (!th || !td) continue;

      const key = th.textContent?.trim().toLowerCase();
      if (key === 'manufacturer number') {
        return td.textContent?.trim() || null;
      }
    }

    return null;
  });

  const scraped_at: string = new Date().toISOString();

  const product = {
    url,
    item_id,
    title,
    brand,
    product_category,
    category_tree,
    description,
    price,
    sale_price,
    availability,
    image_url,
    additional_image_urls,
    specs,
    star_rating,
    review_count,
    gtin,
    mpn,
    scraped_at,
  };

  await fs.mkdir('output', { recursive: true });

  await fs.writeFile(
    'output/product.json',
    JSON.stringify(product, null, 2),
    'utf-8'
  );

  console.log('Saved to output/product.json');

  await browser.close();
})();

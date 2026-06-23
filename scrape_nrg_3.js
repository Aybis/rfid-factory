const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('https://business.nrg.com/campaigns/build-your-data-center/', { waitUntil: 'networkidle2' });
  
  // Extract all text content from the DOM, even if hidden
  const text = await page.evaluate(() => {
    // Collect text from headings, paragraphs, and list items
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span.line, div.text, div.content');
    const texts = new Set();
    elements.forEach(el => {
        if (el.textContent && el.textContent.trim().length > 0) {
            texts.add(el.textContent.trim());
        }
    });
    return Array.from(texts).join('\n');
  });
  
  console.log("--- ALL TEXT ---");
  console.log(text);
  
  await browser.close();
})();

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Navigate and wait until network is relatively idle
  await page.goto('https://business.nrg.com/campaigns/build-your-data-center/', { waitUntil: 'networkidle2' });
  
  // Scroll down multiple times to trigger animations and lazy loading
  for (let i = 0; i < 15; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await new Promise(r => setTimeout(r, 500));
  }
  
  // Extract visible text
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text);
  
  // Optionally, let's also extract links to other campaign sub-pages
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a'))
      .map(a => a.href)
      .filter(href => href.includes('build-your-data-center') || href.includes('business.nrg.com/campaigns'));
  });
  console.log("--- LINKS ---");
  console.log([...new Set(links)].join('\n'));
  
  await browser.close();
})();

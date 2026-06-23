const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Navigate and wait until network is relatively idle
  await page.goto('https://business.nrg.com/campaigns/build-your-data-center/', { waitUntil: 'networkidle2' });
  
  // Click the enter button to start the experience
  try {
      await page.waitForSelector('#enter-button', { timeout: 5000 });
      await page.click('#enter-button');
      await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
      console.log("No enter button found or clickable");
  }

  // Scroll down multiple times to trigger animations and lazy loading
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => {
      window.scrollBy(0, window.innerHeight);
    });
    await new Promise(r => setTimeout(r, 800));
  }
  
  // Extract visible text
  const text = await page.evaluate(() => document.body.innerText);
  console.log("--- VISIBLE TEXT ---");
  console.log(text);
  
  await browser.close();
})();

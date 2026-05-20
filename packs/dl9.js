const puppeteer = require('puppeteer');
const fs = require('fs');

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Login
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(async () => {
    await fetch('/index.php?m=home&c=member&a=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=121041965&password=cx182728'
    });
  });
  await new Promise(r => setTimeout(r, 3000));

  // Intercept /f/d response with FULL body
  page.on('response', async (resp) => {
    if (resp.url().endsWith('/f/d')) {
      try {
        const text = await resp.text();
        console.log('=== /f/d RESPONSE ===');
        console.log('Status: ' + resp.status());
        console.log('Headers: ' + JSON.stringify(resp.headers()));
        console.log('Body: ' + text);
        console.log('=== END ===');
      } catch(e) {
        console.log('Error reading /f/d: ' + e.message);
      }
    }
  });

  // Navigate and trigger download
  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Triggered, waiting...');
  await new Promise(r => setTimeout(r, 15000));

  await browser.close();
}

download().catch(e => { console.error(e); process.exit(1); });

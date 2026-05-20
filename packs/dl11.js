const puppeteer = require('puppeteer');
const fs = require('fs');

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Login via fetch (same as before but also capture the response)
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  
  const loginResult = await page.evaluate(async () => {
    const resp = await fetch('/index.php?m=home&c=member&a=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=121041965&password=cx182728'
    });
    return { status: resp.status, ok: resp.ok };
  });
  console.log('Login fetch: ' + JSON.stringify(loginResult));
  await new Promise(r => setTimeout(r, 3000));

  // Now get ALL cookies from the browser session
  const cookies = await page.cookies();
  console.log('Session cookies:');
  for (const c of cookies) {
    console.log(`  ${c.name}=${c.value.substring(0,30)}... (domain: ${c.domain}, httpOnly: ${c.httpOnly})`);
  }

  // Try downloading via page's fileGet with cookies
  page.on('response', async (resp) => {
    if (resp.url().endsWith('/f/d')) {
      const text = await resp.text();
      console.log('\n/f/d response: ' + text.substring(0, 300));
    }
  });

  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Before triggering download, check for the download token
  const debug = await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (!btn) return 'no btn';
    return {
      rurl: btn.getAttribute('rurl'),
      token: btn.getAttribute('token'),
      extime: btn.getAttribute('extime'),
      ftype: btn.getAttribute('ftype'),
      itemid: btn.getAttribute('itemid')
    };
  });
  console.log('Download params: ' + JSON.stringify(debug));

  // Try calling fileGet
  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Triggered, waiting...');
  await new Promise(r => setTimeout(r, 10000));

  await browser.close();
  console.log('Done');
}

download().catch(e => { console.error(e); process.exit(1); });

const puppeteer = require('puppeteer');
const fs = require('fs');

const DOWNLOAD_DIR = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs';
const COOKIE_FILE = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs/cookies.txt';

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR });

  // Inject cookies
  const raw = fs.readFileSync(COOKIE_FILE, 'utf8');
  for (const line of raw.split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length >= 7) {
      try { await page.setCookie({ domain: parts[0].replace(/^\./, ''), path: parts[2], name: parts[5], value: parts[6] }); } catch(e) {}
    }
  }

  // Capture response BODIES for key endpoints
  page.on('response', async (resp) => {
    const url = resp.url();
    if (url.endsWith('/f/d') || url.includes('/jsonComp/f/d/l')) {
      try {
        const body = await resp.text();
        console.log('\n=== ' + url + ' ===');
        console.log(body.substring(0, 2000));
        console.log('...');
      } catch(e) {
        console.log('Cannot read body: ' + e.message);
      }
    }
  });

  // Also intercept to see if any URL redirects to a zip
  await page.setRequestInterception(true);
  page.on('request', async (req) => {
    const url = req.url();
    if (url.includes('zip') || url.includes('download') || url.includes('resc-')) {
      console.log('[REQ] ' + url);
      console.log('  Headers: ' + JSON.stringify(req.headers()));
    }
    req.continue();
  });

  console.log('=== Q版古代军队塔防 ===');
  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Triggered, waiting...');
  await new Promise(r => setTimeout(r, 12000));

  await browser.close();
  console.log('\nDone!');
}

download().catch(e => { console.error(e); process.exit(1); });

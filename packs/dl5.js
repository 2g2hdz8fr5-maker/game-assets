const puppeteer = require('puppeteer');
const fs = require('fs');

const DOWNLOAD_DIR = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs';
const COOKIE_FILE = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs/cookies.txt';

const PACKS = [
  { name: '1-q-ancient-army', url: 'https://www.aigei.com/set/qbanzhongguogudaijun.html', desc: 'Q版古代军队塔防' },
  { name: '4-pixel-wulin', url: 'https://www.aigei.com/view/72327-43060330.html', desc: '像素武林塔防' }
];

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

  // Monitor ALL responses with full details
  page.on('response', async (resp) => {
    const url = resp.url();
    const headers = resp.headers();
    const ct = headers['content-type'] || '';
    const cd = headers['content-disposition'] || '';
    
    if (url.includes('/f/d') || url.includes('/down') || url.includes('.zip') || 
        ct.includes('zip') || ct.includes('octet') || cd.includes('attachment') ||
        url.includes('cdn-sqn') && url.includes('resc')) {
      console.log('\n[RESP] ' + url);
      console.log('  Content-Type: ' + ct);
      console.log('  Content-Disposition: ' + cd);
      console.log('  Status: ' + resp.status());
    }
  });

  // Also track new windows/iframes
  page.on('popup', async (popup) => {
    console.log('\n[POPUP] ' + popup.url());
  });

  for (const pack of PACKS) {
    console.log('\n=== ' + pack.desc + ' ===');
    try {
      await page.goto(pack.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 2000));

      await page.evaluate(() => {
        const btn = document.querySelector('[ftype="resc_zip"]');
        if (btn && typeof fileGet === 'function') {
          fileGet(btn, 'down');
        }
      });
      console.log('  Triggered download');
      await new Promise(r => setTimeout(r, 10000));
    } catch (e) {
      console.log('  Error: ' + e.message);
    }
  }

  // Check for new iframes
  const iframes = await page.$$('iframe');
  for (const iframe of iframes) {
    const src = await iframe.evaluate(el => el.src);
    if (src) console.log('\n[IFRAME] ' + src);
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
  console.log('\nDone!');
}

download().catch(e => { console.error(e); process.exit(1); });

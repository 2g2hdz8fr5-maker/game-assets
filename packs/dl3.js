const puppeteer = require('puppeteer');
const fs = require('fs');

const DOWNLOAD_DIR = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs';
const COOKIE_FILE = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs/cookies.txt';

const PACKS = [
  { name: '1-q-ancient-army', url: 'https://www.aigei.com/set/qbanzhongguogudaijun.html', desc: 'Q版古代军队塔防' },
  { name: '2-ink-bg', url: 'https://www.aigei.com/set/zhongshigudianshuimo.html', desc: '中式水墨背景' },
  { name: '3-td-ui', url: 'https://www.aigei.com/set/2dyouxidiguotafang_u.html', desc: '帝国塔防UI' },
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
      try {
        await page.setCookie({
          domain: parts[0].replace(/^\./, ''),
          path: parts[2],
          name: parts[5],
          value: parts[6]
        });
      } catch(e) {}
    }
  }
  console.log('Cookies loaded');

  for (const pack of PACKS) {
    console.log('\n=== ' + pack.desc + ' ===');
    try {
      await page.goto(pack.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      const result = await page.evaluate(() => {
        const btn = document.querySelector('[ftype="resc_zip"]');
        if (!btn) return 'NO_BTN';
        const rurl = btn.getAttribute('rurl');
        const token = btn.getAttribute('token');
        if (typeof fileGet === 'function') {
          fileGet(btn, 'down');
          return 'OK:' + rurl + ':' + token;
        }
        btn.click();
        return 'CLICK:' + rurl + ':' + token;
      });
      console.log('  ' + result);
      await new Promise(r => setTimeout(r, 15000));
    } catch (e) {
      console.log('  Error: ' + e.message);
    }
  }

  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  console.log('\nDone!');
}

download().catch(e => { console.error(e); process.exit(1); });

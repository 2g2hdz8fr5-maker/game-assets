const puppeteer = require('puppeteer');
const fs = require('fs');

const DOWNLOAD_DIR = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs';

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR });

  // DON'T re-login - use session from previous run
  // The session cookies from dl15 are still in browser profile
  
  // First, ensure we're logged in by logging in via the main page
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
 
  // Login via the actual login flow with the text-login popup
  // The popup is loaded via JS after clicking login button
  await page.click('#loginBtn');
  await new Promise(r => setTimeout(r, 3000));

  // The login popup has class "text-login" and loads content dynamically
  // Try to find the iframe or dynamic content
  const loginHandled = await page.evaluate(() => {
    // Check for login iframes
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
      if (iframe.src.includes('login') || iframe.src.includes('member')) {
        return 'iframe: ' + iframe.src;
      }
    }
    
    // Check for dynamically added inputs
    const allInputs = document.querySelectorAll('input:not([type="hidden"])');
    const pwInputs = document.querySelectorAll('input[type="password"]');
    
    return 'text inputs: ' + allInputs.length + ', pw inputs: ' + pwInputs.length;
  });
  console.log('Login popup state: ' + loginHandled);

  // Try a different approach: POST to the login endpoint directly with fetch
  // but this time include the CSRF token from the page
  await page.evaluate(async () => {
    const csrf = document.getElementById('pIii111lllE')?.value || '';
    const formData = new URLSearchParams();
    formData.append('username', '121041965');
    formData.append('password', 'cx182728');
    
    const resp = await fetch('/index.php?m=home&c=member&a=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-ETag': csrf
      },
      body: formData.toString(),
      credentials: 'include'
    });
    return { ok: resp.ok, status: resp.status };
  });
  await new Promise(r => setTimeout(r, 2000));

  // Check login
  const state = await page.evaluate(() => ({
    loginDisplay: window.getComputedStyle(document.querySelector('#loginBtn')).display,
    userInfo: document.querySelector('.login-userinfo-name')?.textContent?.trim() || ''
  }));
  console.log('Login state: ' + JSON.stringify(state));

  // Try downloads  
  const packs = [
    { name: '1-q-ancient-army', url: 'https://www.aigei.com/set/qbanzhongguogudaijun.html', desc: 'Q版古代军队塔防' },
    { name: '4-pixel-wulin', url: 'https://www.aigei.com/view/72327-43060330.html', desc: '像素武林塔防' }
  ];

  for (const pack of packs) {
    console.log('\n--- ' + pack.desc + ' ---');
    await page.goto(pack.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    // Call fileGet and also capture the network
    const result = await page.evaluate(() => {
      const btn = document.querySelector('[ftype="resc_zip"]');
      if (!btn) return 'NO_BTN';
      if (typeof fileGet === 'function') {
        fileGet(btn, 'down');
        return 'OK';
      }
      return 'NO_FUNC';
    });
    console.log('  fileGet: ' + result);
    await new Promise(r => setTimeout(r, 15000));
  }

  // Check for downloaded files
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
  console.log('\nDone! Check ' + DOWNLOAD_DIR);
}

download().catch(e => { console.error(e); process.exit(1); });

const puppeteer = require('puppeteer');
const fs = require('fs');

const DOWNLOAD_DIR = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs';

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR });

  // Step 1: Login via the login popup
  console.log('Going to aigei.com...');
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click the login text/button to open login popup
  console.log('Opening login popup...');
  const loginClicked = await page.evaluate(() => {
    // Try multiple selectors for the login trigger
    const selectors = [
      '.login-btn', '#loginBtn', '[class*="loginBtn"]',
      'a[href*="login"]', '.unlogin-hide .login-btn',
      '#loginPopBtn', '[onclick*="login"]'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) { el.click(); return 'clicked: ' + sel; }
    }
    // Try clicking the text "登录"
    const all = document.querySelectorAll('*');
    for (const el of all) {
      if (el.textContent.trim() === '登录' && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
        el.click();
        return 'clicked text 登录 on ' + el.tagName;
      }
    }
    return 'not found';
  });
  console.log('Login popup: ' + loginClicked);
  await new Promise(r => setTimeout(r, 3000));

  // Debug: what's visible?
  const visibleInputs = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input');
    return Array.from(inputs).map(i => ({
      type: i.type,
      name: i.name,
      placeholder: i.placeholder,
      visible: i.offsetParent !== null
    }));
  });
  console.log('Visible inputs: ' + JSON.stringify(visibleInputs));

  // Fill login form
  const userSel = 'input[name="username"], input[name="mobile"], input[name="account"], input[type="text"][name]';
  const passSel = 'input[name="password"], input[name="pass"], input[type="password"]';
  
  try {
    await page.waitForSelector(userSel, { timeout: 5000 });
    await page.type(userSel, '121041965');
    await page.type(passSel, 'cx182728');
    console.log('Credentials filled');
    
    // Click submit
    const submitSel = 'button[type="submit"], input[type="submit"], .login-submit, [class*="loginSubmit"], .popup-submit';
    await page.waitForSelector(submitSel, { timeout: 3000 });
    await page.click(submitSel);
    console.log('Submitted, waiting...');
    await new Promise(r => setTimeout(r, 5000));
  } catch (e) {
    console.log('Login form error: ' + e.message);
    
    // Try alternative: POST login directly
    console.log('Trying direct POST login...');
    await page.evaluate(async () => {
      const resp = await fetch('/index.php?m=home&c=member&a=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'username=121041965&password=cx182728'
      });
    });
    await new Promise(r => setTimeout(r, 3000));
  }

  // Check if logged in
  const loggedIn = await page.evaluate(() => {
    const logoutBtn = document.querySelector('[href*="logout"], [class*="logout"]');
    const userInfo = document.querySelector('.login-userinfo-name, [class*="userinfo"]');
    return !!(logoutBtn || userInfo);
  });
  console.log('Logged in: ' + loggedIn);

  // Step 2: Download packs
  const packs = [
    { name: '1-q-ancient-army', url: 'https://www.aigei.com/set/qbanzhongguogudaijun.html', desc: 'Q版古代军队塔防' },
    { name: '4-pixel-wulin', url: 'https://www.aigei.com/view/72327-43060330.html', desc: '像素武林塔防' }
  ];

  for (const pack of packs) {
    console.log('\n=== ' + pack.desc + ' ===');
    await page.goto(pack.url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2000));

    const result = await page.evaluate(() => {
      const btn = document.querySelector('[ftype="resc_zip"]');
      if (!btn) return 'NO_BTN';
      if (typeof fileGet === 'function') { fileGet(btn, 'down'); return 'OK'; }
      btn.click(); return 'CLICK';
    });
    console.log('  ' + result);
    await new Promise(r => setTimeout(r, 12000));
  }

  await new Promise(r => setTimeout(r, 3000));
  await browser.close();
  console.log('\nDone!');
}

download().catch(e => { console.error(e); process.exit(1); });

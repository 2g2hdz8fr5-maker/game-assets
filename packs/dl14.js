const puppeteer = require('puppeteer');

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Check if already logged in
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Check login state BEFORE login
  let state = await page.evaluate(() => {
    const userNameEl = document.querySelector('.login-userinfo-name');
    const loginBtn = document.querySelector('#loginBtn');
    const logoutBtn = document.querySelector('[href*="loginout"]');
    return {
      beforeLogin: {
        userName: userNameEl ? userNameEl.textContent.trim() : 'none',
        loginBtnVisible: loginBtn ? loginBtn.style.display : 'none',
        loginBtnText: loginBtn ? loginBtn.textContent.trim() : 'none',
        hasLogout: !!logoutBtn
      }
    };
  });
  console.log('Before login: ' + JSON.stringify(state.beforeLogin));

  // Try clicking the login button to open popup
  const loginBtn = await page.$('#loginBtn');
  if (loginBtn) {
    console.log('Clicking login button...');
    await loginBtn.click();
    await new Promise(r => setTimeout(r, 3000));

    // Check for modal/popup
    const modalInfo = await page.evaluate(() => {
      const modals = document.querySelectorAll('.modal, .popup, .dialog, [class*="login"]');
      const result = [];
      for (const m of modals) {
        if (m.offsetParent !== null) {
          result.push({
            className: m.className,
            id: m.id,
            visible: true,
            hasInputs: m.querySelectorAll('input').length
          });
        }
      }
      return result;
    });
    console.log('Visible modals: ' + JSON.stringify(modalInfo));
    
    // Look for login iframe
    const iframes = await page.$$('iframe');
    for (const iframe of iframes) {
      const src = await iframe.evaluate(el => el.src);
      console.log('Iframe: ' + src);
    }
  }

  // Try URL-based login approach
  console.log('\nTrying URL-based login...');
  await page.goto('https://www.aigei.com/index.php?m=home&c=member&a=login&username=121041965&password=cx182728', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));

  // Check state after
  state = await page.evaluate(() => {
    const userNameEl = document.querySelector('.login-userinfo-name');
    const loginBtn = document.querySelector('#loginBtn');
    return {
      afterLogin: {
        userName: userNameEl ? userNameEl.textContent.trim() : 'none',
        loginBtnVisible: loginBtn ? window.getComputedStyle(loginBtn).display : 'none',
        url: window.location.href
      }
    };
  });
  console.log('After login: ' + JSON.stringify(state.afterLogin));

  // Try download again
  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  page.on('response', async (resp) => {
    if (resp.url().endsWith('/f/d')) {
      const text = await resp.text();
      console.log('/f/d: ' + text.substring(0, 200));
    }
  });

  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Triggered, waiting...');
  await new Promise(r => setTimeout(r, 10000));

  await browser.close();
}

download().catch(e => { console.error(e); process.exit(1); });

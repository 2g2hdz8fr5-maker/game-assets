const puppeteer = require('puppeteer');
const fs = require('fs');

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Login via actual form submission
  console.log('Logging in via form...');
  await page.goto('https://www.aigei.com/index.php?m=home&c=member&a=login', { waitUntil: 'networkidle2', timeout: 30000 });

  // Set form fields via JS and submit the form
  const loggedIn = await page.evaluate(() => {
    // Create a form and submit it to set cookies properly
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/index.php?m=home&c=member&a=login';
    form.style.display = 'none';
    
    const user = document.createElement('input');
    user.type = 'hidden';
    user.name = 'username';
    user.value = '121041965';
    
    const pass = document.createElement('input');
    pass.type = 'hidden';
    pass.name = 'password';
    pass.value = 'cx182728';
    
    form.appendChild(user);
    form.appendChild(pass);
    document.body.appendChild(form);
    form.submit();
    return true;
  });
  
  await new Promise(r => setTimeout(r, 5000));
  console.log('Login form submitted');

  // Check if logged in
  const checkLogin = await page.evaluate(() => {
    const logoutEl = document.querySelector('[href*="logout"], [href*="loginout"]');
    const userName = document.querySelector('.login-userinfo-name');
    return {
      hasLogout: !!logoutEl,
      userName: userName ? userName.textContent.trim() : '',
      url: window.location.href
    };
  });
  console.log('Login check: ' + JSON.stringify(checkLogin));

  // Intercept f/d response
  page.on('response', async (resp) => {
    if (resp.url().endsWith('/f/d')) {
      const text = await resp.text();
      console.log('/f/d response: ' + text.substring(0, 500));
    }
  });

  // Try download
  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Download triggered, waiting...');
  await new Promise(r => setTimeout(r, 15000));

  await browser.close();
  console.log('Done!');
}

download().catch(e => { console.error(e); process.exit(1); });

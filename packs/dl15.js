const puppeteer = require('puppeteer');

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Step 1: Login properly - navigate to login page, fill the real form
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Click login button
  await page.click('#loginBtn');
  await new Promise(r => setTimeout(r, 2000));

  // The login modal should be visible now - find inputs
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      type: i.type,
      name: i.name,
      id: i.id,
      className: i.className,
      visible: i.offsetParent !== null,
      placeholder: i.placeholder
    }));
  });
  console.log('All inputs: ' + JSON.stringify(inputs, null, 2));

  // Type into visible text/password inputs
  const visibleInputs = await page.$$('input:not([type="hidden"])');
  console.log('Visible inputs count: ' + visibleInputs.length);
  
  for (const inp of visibleInputs) {
    const type = await inp.evaluate(el => el.type);
    const name = await inp.evaluate(el => el.name);
    const ph = await inp.evaluate(el => el.placeholder);
    console.log(`  Input: type=${type} name=${name} placeholder="${ph}"`);
    
    if (type === 'text' || type === 'number' || name.includes('user') || name.includes('mobile') || name.includes('account') || ph.includes('手机') || ph.includes('账号')) {
      await inp.click();
      await inp.type('121041965');
      console.log('  -> filled username');
    } else if (type === 'password' || name.includes('pass')) {
      await inp.click();
      await inp.type('cx182728');
      console.log('  -> filled password');
    }
  }

  // Find and click submit button
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, input[type="submit"], [class*="submit"]')).map(b => ({
      text: b.textContent.trim(),
      type: b.type,
      className: b.className,
      visible: b.offsetParent !== null
    }));
  });
  console.log('Buttons: ' + JSON.stringify(buttons.filter(b => b.visible), null, 2));

  // Click submit
  const submitClicked = await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      if (b.offsetParent !== null && (b.textContent.includes('登录') || b.textContent.includes('登 录') || b.type === 'submit')) {
        b.click();
        return 'clicked: ' + b.textContent.trim();
      }
    }
    return 'not found';
  });
  console.log('Submit: ' + submitClicked);
  await new Promise(r => setTimeout(r, 5000));

  // Check login state
  const state = await page.evaluate(() => ({
    loginBtn: window.getComputedStyle(document.querySelector('#loginBtn')).display,
    userInfo: document.querySelector('.login-userinfo-name')?.textContent?.trim() || '',
    hasLogout: !!document.querySelector('[href*="loginout"]')
  }));
  console.log('After login: ' + JSON.stringify(state));

  await browser.close();
}

download().catch(e => { console.error(e); process.exit(1); });

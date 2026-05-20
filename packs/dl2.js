const puppeteer = require('puppeteer');
const path = require('path');

const DOWNLOAD_DIR = 'D:\360MoveData\Users\12104\Desktop\games\game-assets\packs';

const PACKS = [
  { name: '1-q-ancient-army', url: 'https://www.aigei.com/set/qbanzhongguogudaijun.html', desc: 'Q版古代军队塔防' },
  { name: '2-ink-bg', url: 'https://www.aigei.com/set/zhongshigudianshuimo.html', desc: '中式水墨背景' },
  { name: '3-td-ui', url: 'https://www.aigei.com/set/2dyouxidiguotafang_u.html', desc: '帝国塔防UI' },
  { name: '4-pixel-wulin', url: 'https://www.aigei.com/view/72327-43060330.html', desc: '像素武林塔防' }
];

async function download() {
  const browser = await puppeteer.launch({ 
    headless: false,  // Show browser so we can see what's happening
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  const client = await page.target().createCDPSession();
  await client.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DOWNLOAD_DIR });

  // Go to main page and login
  console.log('Opening aigei.com...');
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Click login button
  const loginBtn = await page.$('.login-btn, #loginBtn, [class*="loginBtn"]');
  if (loginBtn) {
    console.log('Clicking login button...');
    await loginBtn.click();
    await new Promise(r => setTimeout(r, 2000));

    // Type credentials in popup
    // Try multiple possible selectors
    const userInput = await page.$('input[name="username"], input[placeholder*="手机"], input[placeholder*="账号"], input[type="text"]');
    const passInput = await page.$('input[name="password"], input[placeholder*="密码"], input[type="password"]');
    
    if (userInput && passInput) {
      console.log('Filling credentials...');
      await userInput.click();
      await userInput.type('121041965');
      await passInput.click();
      await passInput.type('cx182728');
      
      // Find and click submit
      const submitBtn = await page.$('button[type="submit"], .login-submit, [class*="loginSubmit"]');
      if (submitBtn) {
        await submitBtn.click();
        console.log('Submitted, waiting...');
        await new Promise(r => setTimeout(r, 5000));
      }
    } else {
      console.log('Could not find login inputs');
    }
  } else {
    console.log('Could not find login button');
  }

  // Now download each pack
  for (const pack of PACKS) {
    console.log(`\n=== ${pack.desc} ===`);
    try {
      await page.goto(pack.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise(r => setTimeout(r, 3000));

      // Try to find and click the zip download button
      const btn = await page.$('[ftype="resc_zip"]');
      if (btn) {
        const token = await btn.evaluate(el => el.getAttribute('token'));
        console.log(`  Clicking download (token=${token})...`);
        await btn.click();
        await new Promise(r => setTimeout(r, 12000));
      } else {
        // Try clicking any element with "zip" or "压缩包" text
        console.log('  Looking for zip button...');
        const zipEl = await page.$('.zip-btn, [class*="zip"], .down-btn-wrap-item');
        if (zipEl) {
          await zipEl.click();
          await new Promise(r => setTimeout(r, 12000));
        } else {
          console.log('  Nothing found, dumping page buttons...');
          const btns = await page.$$eval('[ftype]', els => els.map(e => e.getAttribute('ftype')));
          console.log('  Available ftypes: ' + JSON.stringify(btns));
        }
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  console.log('\nKeeping browser open for 10s...');
  await new Promise(r => setTimeout(r, 10000));
  await browser.close();
  console.log('Done!');
}

download().catch(e => { console.error(e); process.exit(1); });

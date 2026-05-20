const puppeteer = require('puppeteer');

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Login
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(async () => {
    await fetch('/index.php?m=home&c=member&a=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=121041965&password=cx182728'
    });
  });
  await new Promise(r => setTimeout(r, 3000));

  // NOW navigate to the pack page
  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Override XHR AFTER page scripts have loaded
  await page.evaluate(() => {
    const XHR = XMLHttpRequest.prototype;
    const origOpen = XHR.open;
    const origSend = XHR.send;
    const origSetHeader = XHR.setRequestHeader;
    
    XHR.open = function(method, url) {
      this._capturedUrl = url;
      this._capturedMethod = method;
      this._capturedHeaders = {};
      return origOpen.apply(this, arguments);
    };
    XHR.setRequestHeader = function(name, value) {
      if (this._capturedHeaders) this._capturedHeaders[name] = value;
      return origSetHeader.apply(this, arguments);
    };
    XHR.send = function(body) {
      const url = this._capturedUrl;
      if (url && (url.includes('/f/d') || url.includes('download') || url.includes('/gei-'))) {
        console.log('=== XHR ===');
        console.log('URL: ' + url);
        console.log('Headers: ' + JSON.stringify(this._capturedHeaders));
        console.log('Body: ' + (body ? body.substring(0, 200) : 'none'));
      }
      const self = this;
      this.addEventListener('load', function() {
        if (url && url.includes('/f/d')) {
          console.log('Response: ' + self.responseText);
          // If response has a download URL, navigate to it
          try {
            const json = JSON.parse(self.responseText);
            if (json.url) {
              console.log('Download URL: ' + json.url);
              window.open(json.url);
            }
          } catch(e) {}
        }
      });
      return origSend.apply(this, arguments);
    };
    console.log('XHR override installed');
  });

  // Get CSRF
  const csrf = await page.evaluate(() => {
    const el = document.getElementById('pIii111lllE');
    return el ? el.value : 'NONE';
  });
  console.log('CSRF: ' + csrf.substring(0, 50) + '...');

  // Trigger download  
  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Triggered...');
  await new Promise(r => setTimeout(r, 10000));

  // Read console
  page.on('console', msg => console.log('PAGE: ' + msg.text()));

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
}

download().catch(e => { console.error(e); process.exit(1); });

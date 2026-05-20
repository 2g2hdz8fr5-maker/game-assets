const puppeteer = require('puppeteer');

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Login
  await page.evaluate(async () => {
    await fetch('/index.php?m=home&c=member&a=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=121041965&password=cx182728'
    });
  });
  await new Promise(r => setTimeout(r, 3000));

  // Override XMLHttpRequest to intercept the actual download request
  await page.evaluate(() => {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
    
    XMLHttpRequest.prototype.open = function(method, url) {
      this._url = url;
      this._method = method;
      this._headers = {};
      return origOpen.apply(this, arguments);
    };
    
    XMLHttpRequest.prototype.setRequestHeader = function(name, value) {
      this._headers[name] = value;
      return origSetRequestHeader.apply(this, arguments);
    };
    
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(body) {
      if (this._url && (this._url.includes('/f/d') || this._url.includes('download'))) {
        console.log('XHR ' + this._method + ' ' + this._url);
        console.log('XHR Headers: ' + JSON.stringify(this._headers));
        console.log('XHR Body: ' + body);
      }
      this.addEventListener('load', function() {
        if (this._url && (this._url.includes('/f/d') || this._url.includes('download'))) {
          console.log('XHR Response: ' + this.responseText.substring(0, 300));
        }
      });
      return origSend.apply(this, arguments);
    };
  });

  // Navigate to pack page and trigger download
  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  // Get the hidden CSRF token
  const csrf = await page.evaluate(() => {
    const el = document.getElementById('pIii111lllE');
    return el ? el.value : 'NOT FOUND';
  });
  console.log('CSRF token: ' + csrf);

  // Trigger download
  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Triggered, waiting for XHR...');
  await new Promise(r => setTimeout(r, 10000));

  // Read console messages
  page.on('console', msg => {
    if (msg.text().includes('XHR') || msg.text().includes('download')) {
      console.log('CONSOLE: ' + msg.text());
    }
  });

  await browser.close();
  console.log('Done');
}

download().catch(e => { console.error(e); process.exit(1); });

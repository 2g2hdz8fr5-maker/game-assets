const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');
const http = require('http');

const DOWNLOAD_DIR = 'D:/360MoveData/Users/12104/Desktop/games/game-assets/packs';

async function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(DOWNLOAD_DIR + '/' + filename);
    const proto = url.startsWith('https') ? https : http;
    proto.get(url, (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        downloadFile(response.headers.location, filename).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

async function download() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // Login via fetch
  console.log('Logging in...');
  await page.goto('https://www.aigei.com/', { waitUntil: 'networkidle2', timeout: 30000 });
  await page.evaluate(async () => {
    await fetch('/index.php?m=home&c=member&a=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'username=121041965&password=cx182728'
    });
  });
  await new Promise(r => setTimeout(r, 3000));
  console.log('Logged in');

  // Intercept ALL requests to find download URLs
  const allRequests = [];
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = req.url();
    if (url.includes('zip') || url.includes('download') || url.includes('.rar') || url.includes('resc-')) {
      console.log('[DOWNLOAD REQ] ' + url);
      allRequests.push(url);
    }
    if (url.includes('/f/d') || url.includes('fileDownload')) {
      console.log('[AJAX] ' + url + ' POST data: ' + (req.postData() || 'none'));
    }
    req.continue();
  });

  page.on('response', async (resp) => {
    const url = resp.url();
    const ct = resp.headers()['content-type'] || '';
    const cd = resp.headers()['content-disposition'] || '';
    
    if (ct.includes('zip') || ct.includes('octet-stream') || cd.includes('attachment') || url.match(/\.(zip|rar)$/)) {
      console.log('[FILE RESP] ' + url + ' ct=' + ct + ' cd=' + cd);
    }
    if ((url.includes('/f/d') || url.includes('download')) && ct === 'text/html') {
      try {
        const body = await resp.text();
        console.log('[HTML RESP] ' + url + ': ' + body.substring(0, 500));
      } catch(e) {}
    }
  });

  // Navigate and download
  console.log('Navigating to Q版古代军队...');
  await page.goto('https://www.aigei.com/set/qbanzhongguogudaijun.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const btn = document.querySelector('[ftype="resc_zip"]');
    if (btn && typeof fileGet === 'function') fileGet(btn, 'down');
  });
  console.log('Triggered, waiting 15s...');
  await new Promise(r => setTimeout(r, 15000));

  // Check for any new windows
  const pages = await browser.pages();
  console.log('Open pages: ' + pages.length);
  for (const p of pages) {
    console.log('  Page URL: ' + p.url());
  }

  console.log('Captured download URLs: ' + JSON.stringify(allRequests));
  
  // Try to download any captured URLs
  for (const url of allRequests) {
    const filename = url.split('/').pop().split('?')[0];
    console.log('Downloading: ' + url + ' -> ' + filename);
    try {
      await downloadFile(url, filename);
      console.log('  Downloaded: ' + filename);
    } catch(e) {
      console.log('  Failed: ' + e.message);
    }
  }

  await browser.close();
  console.log('Done!');
}

download().catch(e => { console.error(e); process.exit(1); });

// ==========================================
// 爱给网素材下载 - 浏览器控制台脚本
// 使用方法：
// 1. 打开 Chrome，登录 aigei.com
// 2. 打开下面任一页面
// 3. 按 F12 打开控制台，粘贴对应代码回车
// ==========================================

// --- 1. Q版古代军队塔防资源 (581张/27MB) ---
// 打开: https://www.aigei.com/set/qbanzhongguogudaijun.html
// 然后运行:
(function(){
  var btn = document.querySelector('[ftype="resc_zip"]');
  if(btn && typeof fileGet==='function') {
    fileGet(btn, 'down');
    console.log('✅ 已触发下载！');
  } else {
    btn.click();
    console.log('⚠️ 尝试点击下载按钮');
  }
})();

// --- 2. 中式古典水墨游戏背景 (43张) ---
// 打开: https://www.aigei.com/set/zhongshigudianshuimo.html
// 如果上面没下载按钮，试试找 .zip-btn:
(function(){
  var btns = document.querySelectorAll('[ftype="resc_zip"], .zip-btn, [onclick*="itemFilePlay"]');
  if(btns.length>0) {
    if(typeof fileGet==='function') fileGet(btns[0], 'down');
    else btns[0].click();
    console.log('✅ 已触发');
  } else {
    console.log('❌ 未找到下载按钮，请检查是否登录');
  }
})();

// --- 3. 2D帝国塔防UI元素专辑 (1525+张) ---
// 打开: https://www.aigei.com/set/2dyouxidiguotafang_u.html
(function(){
  var btns = document.querySelectorAll('[ftype="resc_zip"], .zip-btn, [onclick*="itemFilePlay"]');
  if(btns.length>0) {
    if(typeof fileGet==='function') fileGet(btns[0], 'down');
    else btns[0].click();
    console.log('✅ 已触发');
  } else {
    console.log('❌ 未找到下载按钮');
  }
})();

// --- 4. 像素武林塔防素材 (99张) ---
// 打开: https://www.aigei.com/view/72327-43060330.html
(function(){
  var btn = document.querySelector('[ftype="resc_zip"]');
  if(btn && typeof fileGet==='function') {
    fileGet(btn, 'down');
    console.log('✅ 已触发下载！');
  } else {
    btn.click();
    console.log('⚠️ 尝试点击下载');
  }
})();

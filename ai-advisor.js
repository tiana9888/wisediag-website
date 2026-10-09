/* 智诊科技官网合作咨询助手——基于规则的自动需求收集 */
(function () {
  'use strict';

  if (document.querySelector('.xz-root')) return;

  var ENDPOINT = window.WISEDIAG_AI_LEAD_ENDPOINT || window.WISEDIAG_LEAD_ENDPOINT || '';
  var flow = [
    { key: 'requirement', label: '需求描述', prompt: '感谢您的信任！为了给您推荐最合适的方案，想先了解一下，您目前有什么业务需要咨询或解决的？' },
    { key: 'company', label: '企业名称', prompt: '了解了，您提到的需求我们很感兴趣。方便说一下贵公司或机构的名称吗？我们好安排对应的行业顾问。' },
    { key: 'contact', label: '联系方式', prompt: '方便留个手机号或微信吗？完成需求收集并提交成功后，我们的行业顾问会尽快与您联系。' },
    { key: 'nameTitle', label: '姓名和职位', prompt: '最后想确认一下，您怎么称呼？以及您在公司主要负责哪块业务？这样我们可以安排最匹配的行业顾问。' },
  ];
  var state = {
    mode: 'identity', step: 0, data: {}, technicalCount: 0, demoNotified: false,
    reminderCount: 0, maxReminders: 2, reminderTimer: null, open: false,
  };

  var root = document.createElement('div');
  root.className = 'xz-root';
  root.innerHTML =
    '<button class="xz-launcher" type="button" aria-expanded="false" aria-controls="xz-panel">' +
      '<span class="xz-launcher__avatar"><img src="assets/footer/logo-wisediag.png" alt=""></span>' +
      '<span class="xz-launcher__copy"><small>自动需求收集</small><b>合作咨询助手</b></span>' +
      '<span class="xz-launcher__badge" aria-label="1 条新消息">1</span>' +
    '</button>' +
    '<section class="xz-panel" id="xz-panel" role="dialog" aria-modal="false" aria-labelledby="xz-title" hidden>' +
      '<header class="xz-panel__header">' +
        '<img src="assets/footer/logo-wisediag.png" alt="">' +
        '<span class="xz-panel__title"><b id="xz-title">合作咨询助手</b><small>基于规则 · 自动需求收集</small></span>' +
        '<button class="xz-close" type="button" aria-label="关闭合作咨询助手">×</button>' +
      '</header>' +
      '<div class="xz-messages" role="log" aria-live="polite"></div>' +
      '<footer class="xz-composer">' +
        '<form class="xz-composer__row"><input class="xz-input" type="text" aria-label="输入咨询内容" placeholder="请输入您的问题或回复…" autocomplete="off"><button class="xz-send" type="submit" aria-label="发送">↑</button></form>' +
        '<div class="xz-composer__meta"><button class="xz-human" type="button">联系人工顾问</button><p class="xz-boundary">不提供诊断或治疗建议</p></div>' +
      '</footer>' +
    '</section>';
  document.body.appendChild(root);

  var launcher = root.querySelector('.xz-launcher');
  var badge = root.querySelector('.xz-launcher__badge');
  var panel = root.querySelector('.xz-panel');
  var messages = root.querySelector('.xz-messages');
  var input = root.querySelector('.xz-input');
  var form = root.querySelector('.xz-composer__row');
  var lastFocused = null;

  function text(value) {
    return String(value || '').replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function appendMessage(copy, who) {
    var item = document.createElement('div');
    item.className = 'xz-message' + (who === 'user' ? ' xz-message--user' : '');
    item.innerHTML = '<div class="xz-bubble">' + text(copy) + '</div>';
    messages.appendChild(item);
    scrollToLatest();
    return item;
  }

  function appendHTML(html, className) {
    var holder = document.createElement('div');
    holder.className = className || '';
    holder.innerHTML = html;
    messages.appendChild(holder);
    scrollToLatest();
    return holder;
  }

  function scrollToLatest() {
    requestAnimationFrame(function () { messages.scrollTop = messages.scrollHeight; });
  }

  function identityChoices() {
    var choices = appendHTML(
      '<button class="xz-choice" type="button" data-intent="enterprise"><span><b>企业客户</b><br><small>了解方案、产品接入与合作</small></span><span>→</span></button>' +
      '<button class="xz-choice" type="button" data-intent="personal"><span><b>个人用户</b><br><small>体验好伴 AI 家庭健康服务</small></span><span>→</span></button>' +
      '<button class="xz-choice" type="button" data-intent="human"><span><b>人工顾问</b><br><small>扫码添加企业微信</small></span><span>→</span></button>',
      'xz-choice-list',
    );
    choices.addEventListener('click', function (event) {
      var button = event.target.closest('[data-intent]');
      if (!button) return;
      if (button.dataset.intent === 'enterprise') startEnterprise();
      if (button.dataset.intent === 'personal') showPersonal();
      if (button.dataset.intent === 'human') showHuman();
      choices.remove();
    });
  }

  var DEMO_BLOCKED_HINT = '演示模式下无法收集或提交需求。请扫码联系人工顾问，或发送邮件至 marketing@wisediag.com、致电 15336530072。';

  function resetConversation() {
    clearReminder();
    state.mode = 'identity'; state.step = 0; state.data = {}; state.technicalCount = 0; state.reminderCount = 0;
    state.demoNotified = false;
    messages.innerHTML = '';
    appendMessage('您好，这里是智诊科技合作咨询助手，通过预设规则自动收集合作需求，并非 AI 对话或人工客服。' + (!ENDPOINT ? '当前为演示模式，无法在线提交，信息不会发送给智诊科技，请勿输入个人信息。您可联系 marketing@wisediag.com 或致电 15336530072。' : '完成需求收集后将提交给智诊科技，用于业务沟通。') + '请先选择您的身份：');
    identityChoices();
  }

  function startEnterprise() {
    clearReminder();
    state.step = 0; state.reminderCount = 0;
    appendMessage('企业客户', 'user');
    if (!ENDPOINT) {
      state.mode = 'demo';
      state.data = {};
      appendMessage('企业客户', 'user');
      appendMessage('当前为演示模式，不能在线提交，需求未发送给智诊科技。请勿提供联系人信息；请邮件联系 marketing@wisediag.com 或致电 15336530072，也可扫码联系人工顾问。');
      state.demoNotified = true;
      showHuman();
      return;
    }
    state.mode = 'enterprise';
    askCurrent();
  }

  function askCurrent() {
    appendMessage(flow[state.step].prompt);
    startReminder();
  }

  function looksTechnical(value) {
    return /\bAPI\b|接口|部署|token|模型|私有化|对接|并发|开放平台/i.test(value);
  }

  function validAnswer(value) {
    if (value.trim().length < 2) return false;
    if (flow[state.step].key === 'contact') return /[\dA-Za-z_\-+]{5,}/.test(value.replace(/\s/g, ''));
    return true;
  }

  function handleAnswer(value) {
    value = value.trim();
    if (!value) return;
    if (!ENDPOINT) {
      // 演示模式下不记录、不留存输入内容，也不伪造用户发言
      state.mode = 'demo';
      state.step = 0;
      state.data = {};
      clearReminder();
      if (!state.demoNotified) {
        state.demoNotified = true;
        appendMessage('当前为演示模式，不能在线提交，输入内容不会发送给智诊科技，也不会留存。请勿提供联系人信息；请邮件联系 marketing@wisediag.com 或致电 15336530072，也可扫码联系人工顾问。');
        showHuman();
      } else {
        appendMessage(DEMO_BLOCKED_HINT);
      }
      return;
    }
    appendMessage(value, 'user');
    clearReminder();

    if (state.mode === 'done') {
      appendMessage('这条补充仅显示在当前页面，未发送给智诊科技，也未保存。请联系人工顾问补充需求，或重新开始收集后提交。');
      return;
    }
    if (state.mode !== 'enterprise') {
      if (/企业|公司|机构|合作|方案/.test(value)) startEnterprise();
      else appendMessage('我可以优先协助企业方案咨询。您也可选择下方的人工顾问，或告诉我您想了解的业务场景。');
      return;
    }

    if (looksTechnical(value)) {
      state.technicalCount += 1;
      appendMessage('智诊支持 API、网页、公众号、企业微信以及本地/混合部署，具体方式需结合数据边界、并发与现有系统评估。');
      if (state.technicalCount >= 2) {
        appendHTML('<div class="xz-card"><b>开放平台与接口资料</b><p>可先了解场景级 API、接入方式与私有化部署能力。</p><a href="wisediag-model.html#api">查看开放平台资料</a></div>');
      }
    }

    if (!validAnswer(value)) {
      appendMessage('这条信息似乎还不完整，请再补充一下「' + flow[state.step].label + '」。');
      startReminder();
      return;
    }

    state.data[flow[state.step].key] = value;
    state.step += 1;
    state.reminderCount = 0;
    if (state.step < flow.length) askCurrent();
    else completeLead();
  }

  function startReminder() {
    clearReminder();
    if (state.reminderCount >= state.maxReminders || state.mode !== 'enterprise') return;
    state.reminderTimer = setTimeout(function () {
      state.reminderCount += 1;
      appendHTML('<div class="xz-notice">还在吗？请补充「' + text(flow[state.step].label) + '」，回复后我们会更快为您安排顾问哦～</div>');
      startReminder();
    }, 60000);
  }

  function clearReminder() {
    if (state.reminderTimer) clearTimeout(state.reminderTimer);
    state.reminderTimer = null;
  }

  function completeLead() {
    state.mode = 'done';
    var payload = Object.assign({}, state.data, {
      page: location.pathname.split('/').pop() || 'index.html',
      referrer: document.referrer || '',
      conversation: messages.innerText,
      submittedAt: new Date().toISOString(),
      recipient: 'marketing@wisediag.com',
    });
    sendLead(payload).then(function () {
      appendHTML(
        '<div class="xz-card xz-card--success"><b>咨询需求已提交成功</b><p>行业顾问会尽快与您联系。您也可扫码添加企业微信。</p><img class="xz-qr" src="assets/footer/qr-consult.png" alt="数智营销部企业微信二维码"><div class="xz-card__actions"><button type="button" data-restart>重新开始</button></div></div>',
      ).querySelector('[data-restart]').addEventListener('click', resetConversation);
    }).catch(function () {
      appendHTML('<div class="xz-notice">信息暂未发送成功。请扫码联系人工顾问，或发送邮件至 marketing@wisediag.com。</div>');
      showHuman();
    });
  }

  function sendLead(payload) {
    if (!ENDPOINT) return Promise.reject(new Error('未配置咨询提交接口'));
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (response) { if (!response.ok) throw new Error('AI lead submit failed: ' + response.status); });
  }

  function showPersonal() {
    state.mode = 'personal';
    appendMessage('个人用户', 'user');
    appendHTML('<div class="xz-card"><b>体验好伴 AI</b><p>好伴 AI 面向个人与家庭提供健康咨询、报告解读和家庭健康档案服务。</p><a href="haoban-ai.html">前往好伴 AI 页面</a></div>');
  }

  function showHuman() {
    appendHTML('<div class="xz-card"><b>联系人工顾问</b><p>扫码添加数智营销部企业微信，获取一对一业务咨询。</p><img class="xz-qr" src="assets/footer/qr-consult.png" alt="数智营销部企业微信二维码"></div>');
  }

  function openPanel() {
    lastFocused = document.activeElement;
    state.open = true; panel.hidden = false; launcher.setAttribute('aria-expanded', 'true'); badge.hidden = true;
    setTimeout(function () { input.focus(); scrollToLatest(); }, 30);
  }

  function closePanel() {
    state.open = false; panel.hidden = true; launcher.setAttribute('aria-expanded', 'false');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  launcher.addEventListener('click', function () { state.open ? closePanel() : openPanel(); });
  root.querySelector('.xz-close').addEventListener('click', closePanel);
  root.querySelector('.xz-human').addEventListener('click', showHuman);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var value = input.value;
    input.value = '';
    handleAnswer(value);
  });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && state.open) closePanel(); });

  resetConversation();
})();

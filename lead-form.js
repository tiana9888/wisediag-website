/* =============================================================
   lead-form.js —— 全站统一业务咨询 / 留咨表单
   -------------------------------------------------------------
   职责：
   1. 提供一个统一的留咨表单组件（弹窗 + 页面内联联系区共用同一套字段）
   2. 把站内所有「业务咨询类」按钮统一到这个表单上，点击即弹出
   3. 自动识别来源按钮，预填咨询主题与所属行业
   4. 把页面里已有的内联联系表单替换成同一套字段，保证口径一致

   接入方式（脚本会由 unify-solutions-menu.mjs 自动注入到每个页面）：
     <link rel="stylesheet" href="lead-form.css">
     <script src="lead-form.js" defer></script>

   后端对接：在引入本脚本前设置 window.WISEDIAG_LEAD_ENDPOINT = '/api/leads'
   脚本会以 POST JSON 提交；未设置时仅展示演示提示，不发送或本地留存信息。
   ============================================================= */
(function () {
  'use strict';

  var ENDPOINT = window.WISEDIAG_LEAD_ENDPOINT || '';
  var DEMO_MESSAGE = '当前为演示模式，咨询需求未发送给智诊科技，无法在线提交。请勿填写个人信息；请联系 marketing@wisediag.com 或致电 15336530072。';

  var INDUSTRIES = [
    '药企',
    'IVD 体外诊断',
    '互联网医院',
    '体检中心',
    '医院与医疗机构',
    '药房 / 医药流通',
    '商业健康保险',
    '医美机构',
    '中医养生',
    '营养保健品',
    '其他',
  ];

  var SOURCE_CHANNELS = [
    '搜索引擎',
    '微信公众号',
    '视频号',
    '小红书',
    '知乎',
    '行业会议 / 活动',
    '合作伙伴推荐',
    '朋友 / 同事推荐',
    '其他',
  ];

  /* 从按钮文案推断咨询主题 / 所属行业 */
  var SUBJECT_RULES = [
    [/药企|制药|学术推广|临床研究/i, '药企', '药企'],
    [/IVD|体外诊断|检验|检测/i, 'IVD 体外诊断', 'IVD'],
    [/互联网医院|在线问诊|问诊/i, '互联网医院', '互联网医院'],
    [/体检|团检/i, '体检中心', '体检中心'],
    [/药房|医药流通|药店/i, '药房 / 医药流通', '医药流通'],
    [/保险|核保|理赔/i, '商业健康保险', '商业健康保险'],
    [/医美/i, '医美机构', '医美机构'],
    [/中医|养生/i, '中医养生', '中医养生'],
    [/营养|保健品/i, '营养保健品', '营养保健品'],
    [/一体机|本地部署|私有化/i, '模算智一体机', '模算智一体机'],
  ];

  var seq = 0;

  /* ---------- 统一表单字段 ---------- */
  function fieldsHTML(uid, industry) {
    var options = INDUSTRIES.map(function (name) {
      var sel = name === industry ? ' selected' : '';
      return '<option value="' + name + '"' + sel + '>' + name + '</option>';
    }).join('');
    var sourceOptions = SOURCE_CHANNELS.map(function (name) {
      return '<option value="' + name + '">' + name + '</option>';
    }).join('');

    return (
      (!ENDPOINT ? '<p class="lf-note lf-full">' + DEMO_MESSAGE + '</p>' : '') +
      '<div class="lf-field">' +
      '<label for="lf-company-' + uid + '">单位名称 <i>*</i></label>' +
      '<input id="lf-company-' + uid + '" name="company" type="text" required autocomplete="organization" placeholder="请输入单位名称">' +
      '</div>' +
      '<div class="lf-field">' +
      '<label for="lf-industry-' + uid + '">所属行业</label>' +
      '<select id="lf-industry-' + uid + '" name="industry">' +
      '<option value="">请选择所属行业</option>' + options + '</select>' +
      '</div>' +
      '<div class="lf-field">' +
      '<label for="lf-name-' + uid + '">联系人姓名 <i>*</i></label>' +
      '<input id="lf-name-' + uid + '" name="name" type="text" required autocomplete="name" placeholder="请输入联系人姓名">' +
      '</div>' +
      '<div class="lf-field">' +
      '<label for="lf-title-' + uid + '">职位</label>' +
      '<input id="lf-title-' + uid + '" name="title" type="text" placeholder="请输入职位">' +
      '</div>' +
      '<div class="lf-field">' +
      '<label for="lf-phone-' + uid + '">联系电话 <i>*</i></label>' +
      '<input id="lf-phone-' + uid + '" name="phone" type="tel" required inputmode="tel" autocomplete="tel" placeholder="请输入联系电话">' +
      '</div>' +
      '<div class="lf-field">' +
      '<label for="lf-email-' + uid + '">企业邮箱 <i>*</i></label>' +
      '<input id="lf-email-' + uid + '" name="email" type="email" required autocomplete="email" placeholder="name@company.com">' +
      '</div>' +
      '<div class="lf-field lf-full">' +
      '<label for="lf-source-' + uid + '">您从哪里了解到智诊科技 <i>*</i></label>' +
      '<select id="lf-source-' + uid + '" name="source" required>' +
      '<option value="">请选择信息来源渠道</option>' + sourceOptions + '</select>' +
      '</div>' +
      '<div class="lf-field lf-full">' +
      '<label for="lf-need-' + uid + '">需求与场景说明 <i>*</i></label>' +
      '<textarea id="lf-need-' + uid + '" name="need" required placeholder="请简要描述您的业务需求、行业场景或接入计划"></textarea>' +
      '</div>' +
      '<div class="lf-actions">' +
      '<button class="lf-submit" type="submit">提交咨询需求 <span>↗</span></button>' +
      '<p class="lf-note">提交即表示您同意我们为业务沟通目的处理所填信息。</p>' +
      '</div>' +
      '<p class="lf-message" role="status" aria-live="polite" hidden></p>'
    );
  }

  function createForm(industry) {
    var uid = 'f' + ++seq;
    var form = document.createElement('form');
    form.className = 'lf-form';
    form.setAttribute('novalidate', '');
    form.innerHTML = fieldsHTML(uid, industry);
    bindSubmit(form);
    return form;
  }

  /* ---------- 提交处理 ---------- */
  function bindSubmit(form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var message = form.querySelector('.lf-message');
      var submit = form.querySelector('.lf-submit');

      if (!ENDPOINT) {
        showMessage(message, DEMO_MESSAGE, 'error');
        return;
      }

      var data = {
        company: value(form, 'company'),
        industry: value(form, 'industry'),
        name: value(form, 'name'),
        title: value(form, 'title'),
        phone: value(form, 'phone'),
        email: value(form, 'email'),
        source: value(form, 'source'),
        need: value(form, 'need'),
        page: location.pathname.split('/').pop() || 'index.html',
        referrer: document.referrer || '',
        submittedAt: new Date().toISOString(),
      };

      var problems = [];
      ['company', 'name', 'phone', 'email', 'need', 'source'].forEach(function (key) {
        var field = form.querySelector('[name="' + key + '"]');
        var ok = field.value.trim().length > 0;
        if (key === 'phone') ok = /^[\d+\-() ]{7,20}$/.test(field.value.trim());
        if (key === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        field.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok) problems.push(field);
      });

      if (problems.length) {
        showMessage(message, '请完整填写带 * 的必填项，并检查电话与邮箱格式。', 'error');
        problems[0].focus();
        return;
      }

      submit.disabled = true;
      submit.textContent = '提交中…';

      send(data)
        .then(function () {
          replaceWithSuccess(form);
          document.dispatchEvent(new CustomEvent('wisediag:lead', { detail: data }));
        })
        .catch(function () {
          submit.disabled = false;
          submit.innerHTML = '提交咨询需求 <span>↗</span>';
          showMessage(message, '提交未成功，请稍后重试，或直接邮件联系 marketing@wisediag.com。', 'error');
        });
    });
  }

  function value(form, name) {
    var el = form.querySelector('[name="' + name + '"]');
    return el ? el.value.trim() : '';
  }

  function showMessage(el, text, state) {
    if (!el) return;
    el.hidden = false;
    el.dataset.state = state;
    el.textContent = text;
  }

  function send(data) {
    if (!ENDPOINT) return Promise.reject(new Error('未配置咨询提交接口'));
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(function (res) {
      if (!res.ok) throw new Error('lead submit failed: ' + res.status);
    });
  }

  function replaceWithSuccess(form) {
    var done = document.createElement('div');
    done.className = 'lf-success';
    done.innerHTML =
      '<span class="lf-success-mark">✓</span>' +
      '<b>已收到您的咨询需求</b>' +
      '<p>我们的业务团队会尽快与您联系，围绕场景梳理、能力匹配与接入方式做进一步沟通。</p>';
    var close = document.createElement('button');
    close.type = 'button';
    close.textContent = '继续浏览';
    close.addEventListener('click', function () {
      var modal = document.getElementById('lead-modal');
      if (modal && done.closest('.lead-modal__panel')) closeModal();
    });
    done.appendChild(close);

    var host = form.parentNode;
    host.replaceChild(done, form);
    if (!done.closest('.lead-modal__panel')) {
      close.textContent = '再提交一条需求';
      close.addEventListener('click', function () {
        host.replaceChild(createForm(), done);
      });
    }
  }

  /* ---------- 弹窗 ---------- */
  var modal = null;
  var lastFocused = null;

  function buildModal() {
    modal = document.createElement('div');
    modal.className = 'lead-modal';
    modal.id = 'lead-modal';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="lead-modal__mask" data-lead-close></div>' +
      '<div class="lead-modal__panel" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title">' +
      '<button class="lead-modal__close" type="button" data-lead-close aria-label="关闭咨询表单">×</button>' +
      '<h2 id="lead-modal-title">合作咨询</h2>' +
      '<p class="lead-modal__sub">统一业务咨询入口：行业方案、产品接入、部署方式与商务合作。</p>' +
      '<p class="lead-modal__topic" hidden></p>' +
      '<div class="lead-modal__form"></div>' +
      '<p class="lead-modal__contact"><span><b>邮箱</b> marketing@wisediag.com</span><span><b>电话</b> 15336530072</span><span><b>地址</b> 杭州市临平区杭州智能健康谷A栋7楼</span></p>' +
      '</div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function (event) {
      if (event.target.closest('[data-lead-close]')) closeModal();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
  }

  function openModal(subject, industry, hint) {
    if (!modal) buildModal();
    lastFocused = document.activeElement;

    var topic = modal.querySelector('.lead-modal__topic');
    if (subject) {
      topic.hidden = false;
      topic.textContent = '咨询主题：' + subject;
    } else {
      topic.hidden = true;
    }

    var slot = modal.querySelector('.lead-modal__form');
    slot.innerHTML = '';
    var form = createForm(industry);
    slot.appendChild(form);
    if (hint) {
      var need = form.querySelector('[name="need"]');
      if (need && !need.value) need.value = hint;
    }

    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var first = form.querySelector('[name="company"]');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  /** 供页面直接调用：WiseDiagLead.open('药企方案咨询', '药企') */
  window.WiseDiagLead = { open: openModal, close: closeModal };

  /* ---------- 按钮识别 ---------- */
  var HREF_RE = /#(contact|consult)\s*$/;
  var TEXT_RE =
    /预约业务交流|预约体验交流|预约平台交流|预约专属演示|专属演示|邮件咨询|获取.{0,4}方案|提交合作需求|提交咨询需求|申请合作|联系我们|立即咨询|预约演示|预约方案交流|方案交流|业务咨询|合作咨询|咨询.{0,6}方案|聊聊.{0,4}场景|申请试用|免费试用|预约.{0,4}沟通|商务合作/;
  var MAIL_RE = /^mailto:/i;

  function isLeadTrigger(el) {
    if (!el) return false;
    var tag = el.tagName;
    if (tag !== 'A' && tag !== 'BUTTON') return false;
    // 表单内部的按钮交给表单自身处理
    if (el.closest('form')) return false;
    if (el.hasAttribute('data-lead')) return true;

    var href = (el.getAttribute('href') || '').trim();
    if (HREF_RE.test(href)) return true;
    if (MAIL_RE.test(href) && TEXT_RE.test(el.textContent || '')) return true;

    var text = (el.textContent || '').trim();
    return text.length > 0 && text.length <= 24 && TEXT_RE.test(text);
  }

  function describe(el) {
    // 显式 data-lead 表示页面已指定主题，直接采用，不再走行业规则猜测——
    // 否则「智三多 · 多年体检报告联合解读」会被 /体检/ 规则误判成「体检中心解决方案咨询」。
    // 需要同时指定行业时，在元素上再加 data-lead-industry="xxx"。
    var explicit = (el.getAttribute('data-lead') || '').trim();
    if (explicit) {
      return {
        subject: explicit,
        industry: (el.getAttribute('data-lead-industry') || '').trim(),
      };
    }
    var text = (el.textContent || '').trim();
    for (var i = 0; i < SUBJECT_RULES.length; i++) {
      if (SUBJECT_RULES[i][0].test(text)) {
        return { subject: SUBJECT_RULES[i][2] + '解决方案咨询', industry: SUBJECT_RULES[i][1] };
      }
    }
    return { subject: text.replace(/[→↗←].*$/, '').trim() || '业务咨询', industry: '' };
  }

  document.addEventListener(
    'click',
    function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      var target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      var el = target.closest('a, button');
      if (!isLeadTrigger(el)) return;
      event.preventDefault();
      var info = describe(el);
      openModal(info.subject, info.industry, '希望进一步了解' + info.subject.replace(/解决方案咨询$/, '解决方案') + '。');
    },
    false,
  );

  /* ---------- 内联联系表单 → 统一表单 ---------- */
  function unifyInlineForms() {
    var hosts = document.querySelectorAll('form.contact-form, form#collaboration-form, form.cooperation-form, form.lf-form.lf-host');
    Array.prototype.forEach.call(hosts, function (old) {
      var form = document.createElement('form');
      form.className = 'lf-form lf-host';
      form.setAttribute('novalidate', '');
      form.innerHTML = fieldsHTML('inline' + ++seq, '');
      old.parentNode.replaceChild(form, old);
      bindSubmit(form);
    });
  }

  function boot() {
    buildModal();
    unifyInlineForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

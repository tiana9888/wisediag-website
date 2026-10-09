/* =============================================================
   nav-menu.js —— 导航二级菜单在小屏 / 触屏上的展开与收起
   -------------------------------------------------------------
   背景：站内「产品服务」「解决方案」二级菜单原本只有 :hover 规则，
   触屏设备和小屏下无法展开；小屏 CSS 又把面板设为 display:none，
   导致二级内容完全不可达。本脚本补上点击 / 回车展开能力。
   约定：给触发按钮的父容器加 .is-open，配合 CSS 展示面板。
   ============================================================= */
(function () {
  'use strict';

  var GROUP_SELECTOR = '.solutions-menu, .products-menu, .nav-product-group';
  var TRIGGER_SELECTOR = '.nav-trigger, .nav-link[aria-haspopup]';

  function closeAll(except) {
    var groups = document.querySelectorAll(GROUP_SELECTOR);
    Array.prototype.forEach.call(groups, function (group) {
      if (group === except) return;
      group.classList.remove('is-open');
      setExpanded(group, 'false');
    });
  }

  function triggerOf(group) {
    return group.querySelector(TRIGGER_SELECTOR);
  }

  function setExpanded(group, value) {
    var trigger = triggerOf(group);
    if (trigger && trigger.hasAttribute('aria-haspopup')) trigger.setAttribute('aria-expanded', value);
  }

  function toggle(group) {
    var open = !group.classList.contains('is-open');
    closeAll(group);
    group.classList.toggle('is-open', open);
    setExpanded(group, open ? 'true' : 'false');
  }

  function boot() {
    var groups = document.querySelectorAll(GROUP_SELECTOR);
    Array.prototype.forEach.call(groups, function (group) {
      var trigger = triggerOf(group);
      if (!trigger) return;
      if (trigger.hasAttribute('aria-haspopup') && !trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', 'false');
      }
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        toggle(group);
      });
      trigger.removeAttribute('data-product-link');
      trigger.removeAttribute('data-product');
    });

    document.addEventListener('click', function (event) {
      var node = event.target;
      if (!node || typeof node.closest !== 'function') return;
      if (node.closest(GROUP_SELECTOR)) {
        // 点击面板内的具体链接后收起，点击触发按钮由自身的切换逻辑处理
        if (!node.closest(TRIGGER_SELECTOR)) closeAll(null);
        return;
      }
      closeAll(null);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeAll(null);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

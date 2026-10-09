(function () {
  'use strict';
  const labels = {foundation:'智多星',care:'智小伴',clinical:'智小医',diagnostics:'智小检',pharma:'智小药',workforce:'智小康',wiseclaw:'WiseClaw',nexus:'部署体系'};
  const demos = {
    foundation:['统一组织模型、知识与业务任务','assets/banner/tech-cube.png',['机构知识与数据接入','配置模型与智能体能力','查看运行记录与证据来源']],
    care:['从患者建档，到连续随访服务','assets/brochure/care-interface.webp',['建立纵向健康档案','配置随访与服务计划','跟进反馈与专业协同']],
    clinical:['让资料整理与文书协作更高效','assets/brochure/clinical-interface.webp',['汇集患者资料','辅助整理与文书准备','专业人员复核确认']],
    diagnostics:['让一次检验，连接后续健康服务','assets/brochure/diagnostics-interface.webp',['导入与整理检验报告','查看报告解读与关注项','衔接检后服务与随访']],
    pharma:['连接医学证据与一线专业服务','assets/brochure/pharma-interface.webp',['检索医学资料与证据','准备与审核专业内容','支持一线业务协作']],
    workforce:['从年度体检，到持续健康管理','assets/brochure/workforce-interface.webp',['汇集员工健康资料','查看群体健康概况','跟踪健康服务任务']],
    wiseclaw:['配置可协同的医疗健康智能体','assets/banner/tech-cube.png',['配置智能体与知识','连接任务与工作流程','检查运行与协同记录']]
  };
  function boot(){
    const nav=document.querySelector('.site-header .main-nav, .site-header .nav-links');
    if(nav){
      const toggle=document.createElement('button');toggle.type='button';toggle.className='refresh-mobile-toggle';toggle.textContent='菜单';toggle.setAttribute('aria-expanded','false');nav.id=nav.id||'refresh-main-nav';toggle.setAttribute('aria-controls',nav.id);nav.before(toggle);
      toggle.addEventListener('click',()=>{const open=nav.classList.toggle('refresh-open');toggle.setAttribute('aria-expanded',String(open));toggle.textContent=open?'关闭':'菜单'});
      document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('refresh-open')){nav.classList.remove('refresh-open');toggle.setAttribute('aria-expanded','false');toggle.textContent='菜单';toggle.focus()}});
      nav.addEventListener('click',e=>{if(e.target.closest('a')&&!e.target.closest('[aria-haspopup]')){nav.classList.remove('refresh-open');toggle.setAttribute('aria-expanded','false');toggle.textContent='菜单'}});
    }
    document.querySelectorAll('.home-product-grid article').forEach(card=>{const name=card.querySelector('h3')?.textContent.trim();const key=Object.keys(labels).find(k=>labels[k]===name);if(key&&!card.querySelector('a')){const a=document.createElement('a');a.className='refresh-product-link';a.href='product-services.html#'+key;a.textContent='查看产品与演示 →';card.append(a)}});
    if(!document.getElementById('product-page'))return;
    const dialog=document.createElement('dialog');dialog.className='refresh-lightbox';dialog.setAttribute('aria-label','产品界面大图');dialog.innerHTML='<button type="button" autofocus>关闭</button><img alt="产品界面大图">';document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
    const hero=document.querySelector('#product-page .hero');
    const demo=document.createElement('section');demo.id='operation-demo';demo.className='refresh-demo';hero.after(demo);
    const crumb=document.createElement('div');crumb.className='refresh-crumb';crumb.innerHTML='<a href="index.html">首页</a> / <a href="#overview" data-product-link="overview">产品服务</a>';document.querySelector('.hero-inner').prepend(crumb);
    const subnav=document.createElement('nav');subnav.className='refresh-subnav shell';subnav.setAttribute('aria-label','产品页内导航');subnav.innerHTML='<a href="#operation-demo">操作演示</a><a href="#features">核心能力</a><a href="#scenarios">应用场景</a><a href="#blueprint">产品框架</a><a href="#contact">联系团队</a>';demo.after(subnav);
    const demoLink=document.createElement('a');demoLink.className='button-secondary';demoLink.href='#operation-demo';demoLink.textContent='查看演示内容';document.querySelector('.hero-actions').append(demoLink);
    function update(key){
      const entry=demos[key];demo.hidden=!entry;demoLink.hidden=!entry;subnav.querySelector('a').hidden=!entry;
      document.querySelectorAll('.ps-view-switch a').forEach(a=>{const active=(a.dataset.product||a.dataset.productLink)===key;a.classList.toggle('is-current',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
      const primary=document.querySelector('#primaryAction').closest('a');primary.href=key==='overview'?'#features':'#contact';
      if(key==='overview'){
        const keys=['foundation','care','clinical','diagnostics','pharma','workforce','wiseclaw'];
        document.querySelectorAll('#featureGrid .feature-head').forEach((head,i)=>{if(!keys[i])return;const a=document.createElement('a');a.className='refresh-product-link';a.href='#'+keys[i];a.dataset.productLink=keys[i];a.textContent='查看详情与演示 →';head.append(a)});
      }
      if(!entry)return;
      demo.innerHTML=`<div class="shell"><div class="refresh-demo-head"><h2>${labels[key]} · 操作演示</h2><span class="refresh-status">视频待接入 · 当前为展示预览</span></div><div class="refresh-demo-grid"><figure class="refresh-screen"><button type="button" aria-label="放大${labels[key]}展示图片"><img src="${entry[1]}" alt="${labels[key]}${key==='foundation'||key==='wiseclaw'?'技术示意图':'产品界面参考'}"></button><figcaption><span>${key==='foundation'||key==='wiseclaw'?'技术示意 · 非操作录屏':'产品界面参考 · 非操作录屏'}</span><span>点击查看大图</span></figcaption></figure><div class="refresh-demo-copy"><h3>${entry[0]}</h3><p>拟演示流程</p><ol>${entry[2].map(s=>'<li>'+s+'</li>').join('')}</ol><a class="button-primary" href="#contact" data-lead="${labels[key]}专属演示">预约专属演示 →</a></div></div></div>`;
      demo.querySelector('button').onclick=()=>{const img=dialog.querySelector('img');img.src=entry[1];img.alt=labels[key]+'展示图片';dialog.showModal()};
    }
    window.addEventListener('product-rendered',e=>update(e.detail.key));
    update(location.hash.slice(1)||'overview');
    document.querySelector('#product-page').addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||a.dataset.product||a.dataset.productLink)return;const id=a.getAttribute('href').slice(1);if(id==='contact')return;const target=document.getElementById(id);if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

/* Progressive motion and a connected personal edit. The catalogue works without this file. */
(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new Set();
  const ease = 'cubic-bezier(.22,1,.36,1)';
  function animate(node, frames, options = {}) {
    if (reduced.matches || !node?.animate) return;
    const animation = node.animate(frames, { duration: 620, easing: ease, ...options });
    running.add(animation);
    animation.finished.catch(() => {}).finally(() => running.delete(animation));
    return animation;
  }
  reduced.addEventListener('change', () => { if (reduced.matches) running.forEach(animation => animation.cancel()); });
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const heart = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20.7 4.6a5.4 5.4 0 0 0-7.6 0L12 5.7l-1.1-1.1a5.4 5.4 0 0 0-7.6 7.6L12 21l8.7-8.8a5.4 5.4 0 0 0 0-7.6Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>';

  function entrances() {
    // Animate arrivals without delaying navigation or snapshotting live forms.
    // Back/forward restoration and direct section links keep their position.
    const visit=performance.getEntriesByType('navigation')[0];
    if(!document.querySelector('.campaign-hero')&&!location.hash&&visit?.type!=='back_forward') {
      animate(document.querySelector('main')?.firstElementChild,[{opacity:.4,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:480});
    }
    const seen = new WeakSet();
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      animate(entry.target, [{ opacity: .25, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }]);
    }), { threshold: .12 });
    document.querySelectorAll('.atelier-section-heading,.maison-introduction > p,.signature-story__copy,.atelier-bespoke__copy,.material-study__intro,.personal-edit-invitation > div,.footer-signature').forEach(node => observer.observe(node));
    document.querySelectorAll('.editorial-hero__copy > :is(.editorial-kicker,h1,.editorial-hero__intro,.editorial-actions)').forEach((node,i) => {
      animate(node, [{ opacity: .3, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { delay: i*70, fill: 'backwards', duration: 800 });
    });
    const hero = document.querySelector('.campaign-hero .editorial-hero__visual > img');
    animate(hero, [{ transform: 'scale(1.055)' }, { transform: 'scale(1)' }], { duration: 1400 });
    document.querySelectorAll('.product-grid').forEach(grid => {
      const reveal = () => {
        const rect = grid.getBoundingClientRect();
        [...grid.children].forEach((card,i) => {
          if (seen.has(card)) return;
          seen.add(card);
          if (rect.top < innerHeight && rect.bottom > 0) animate(card,[{opacity:.35,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{delay:Math.min(i,5)*45,fill:'backwards',duration:480});
          else observer.observe(card);
        });
      };
      reveal();
      new MutationObserver(reveal).observe(grid,{childList:true});
    });
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let frame = 0;
      let active;
      document.addEventListener('pointermove', event => {
        const media = event.target.closest('.product-card__media');
        if (!media || reduced.matches) return;
        if (active && active !== media) active.style.transform = '';
        active = media;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect=media.getBoundingClientRect();
          const x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;
          media.style.transform='perspective(900px) rotateX('+(-y*3)+'deg) rotateY('+(x*3)+'deg)';
        });
      },{passive:true});
      document.addEventListener('pointerout', event => {
        if (active && !active.contains(event.relatedTarget)) {cancelAnimationFrame(frame);active.style.transform='';active=null;}
      });
      reduced.addEventListener('change',()=>{cancelAnimationFrame(frame);if(active)active.style.transform='';});
    }
  }

  function setupEdit() {
    if (typeof products === 'undefined' || !window.HTMLDialogElement) return;
    const home=Boolean(document.querySelector('.campaign-hero'));
    const dock=element('nav','journey-dock'+(home?'':' journey-dock--compact'));
    dock.setAttribute('aria-label',home?'Explore the atelier':'Your saved edit');
    const chapters=[['discover','Discover'],['the-edit','The edit'],['material-study','3D atelier'],['your-story','Your story']];
    if(home)chapters.forEach(([id,label])=>{const link=element('a','',label);link.href='#'+id;dock.append(link);});
    const trigger=element('button');trigger.type='button';trigger.dataset.editOpen='';trigger.setAttribute('aria-haspopup','dialog');
    trigger.innerHTML=heart+(home?'':'<span>Your edit</span>')+'<b data-edit-count>0</b>';
    dock.append(trigger);document.body.append(dock);
    const dialog=element('dialog','edit-drawer');dialog.setAttribute('aria-labelledby','saved-edit-title');
    dialog.innerHTML='<header class="edit-drawer__header"><div><p class="editorial-kicker">Collected by you</p><h2 id="saved-edit-title">A little of<br>what moves you.</h2></div><button type="button" data-edit-close aria-label="Close your edit">×</button></header><p class="edit-drawer__intro" data-edit-intro></p><div class="edit-drawer__items" data-edit-items></div><div class="edit-drawer__actions"><a class="atelier-button" href="/shop.html">Keep exploring</a><button type="button" class="atelier-link" data-edit-copy>Copy my edit</button></div><p class="edit-drawer__status" data-edit-status role="status" aria-live="polite"></p>';
    document.body.append(dialog);
    const items=dialog.querySelector('[data-edit-items]');
    const status=dialog.querySelector('[data-edit-status]');
    let locked=false;
    const updateCount=()=>{const count=getFavoriteSlugs().size;trigger.querySelector('b').textContent=count;trigger.setAttribute('aria-label','Open your edit, '+count+' saved '+(count===1?'piece':'pieces'));};
    const render=()=>{
      const saved=getFavoriteSlugs();
      const selection=products.filter(p=>saved.has(p.slug));
      dialog.querySelector('[data-edit-intro]').textContent=selection.length?'Your favourite pieces, together in one place. Saved in this browser.':'Start with something that catches your eye. Tap a heart to make it part of your edit.';
      dialog.querySelector('[data-edit-copy]').hidden=!selection.length;
      const shown=selection.length?selection:['rise-ring','signature-monogram-ring','diamond-bracelet-stack'].map(slug=>products.find(p=>p.slug===slug)).filter(Boolean);
      items.replaceChildren();
      shown.forEach(product=>{
        const row=element('article','edit-drawer__item');row.dataset.editItem=product.slug;
        const photoLink=element('a');photoLink.href=productUrl(product);photoLink.tabIndex=-1;photoLink.setAttribute('aria-hidden','true');
        const image=element('img');image.alt='';image.width=92;image.height=105;image.loading='lazy';image.decoding='async';setResponsivePhoto(image,product.heroImage,'100px');photoLink.append(image);
        const text=element('div');const link=element('a');link.href=productUrl(product);link.append(element('h3','',product.name));text.append(link,element('p','',productPriceLabel(product)));
        const save=element('button');save.type='button';save.innerHTML=heart;save.dataset.editSave=product.slug;
        save.setAttribute('aria-label',(saved.has(product.slug)?'Remove ':'Save ')+product.name);save.setAttribute('aria-pressed',String(saved.has(product.slug)));
        row.append(photoLink,text,save);items.append(row);
      });
      updateCount();
    };
    items.addEventListener('click',event=>{
      const button=event.target.closest('[data-edit-save]');if(!button)return;
      const slug=button.dataset.editSave;const saved=toggleProductFavorite(slug);
      syncFavoriteButtons();renderFavoritesShelf();
      document.dispatchEvent(new CustomEvent('tj:favorites-changed',{detail:{slug,saved}}));
      render();
      (items.querySelector('[data-edit-save="'+slug+'"]')||items.querySelector('button')||dialog.querySelector('[data-edit-close]')).focus();
      status.textContent=saved?'Added to your edit.':'Removed from your edit.';
    });
    trigger.addEventListener('click',()=>{render();status.textContent='';locked=document.body.classList.contains('modal-open');document.body.classList.add('modal-open');dialog.showModal();dialog.querySelector('[data-edit-close]').focus();});
    dialog.querySelector('[data-edit-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{if(!locked)document.body.classList.remove('modal-open');trigger.focus();});
    dialog.querySelector('[data-edit-copy]').addEventListener('click',async()=>{
      const saved=getFavoriteSlugs();
      const text=products.filter(p=>saved.has(p.slug)).map(p=>p.name+'\n'+new URL(productUrl(p),location.origin).href).join('\n\n');
      try{await navigator.clipboard.writeText('My Toronto Jewels Curation edit\n\n'+text);status.textContent='Your edit is copied and ready to share.';}
      catch{status.textContent='Copy is unavailable in this browser. You can open a piece and copy its link.';}
    });
    document.addEventListener('tj:favorites-changed',()=>{updateCount();if(dialog.open)render();animate(trigger,[{transform:'scale(1)'},{transform:'scale(1.09)'},{transform:'scale(1)'}],{duration:360});});
    window.addEventListener('storage',()=>{updateCount();if(dialog.open)render();});
    updateCount();
    if(home){
      const visible=new Map();
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>visible.set(entry.target.id,entry));
        const current=[...visible.values()].filter(entry=>entry.isIntersecting).sort((a,b)=>Math.abs(a.boundingClientRect.top)-Math.abs(b.boundingClientRect.top))[0];
        if(!current)return;
        dock.querySelectorAll('a').forEach(link=>{if(link.hash==='#'+current.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
      },{rootMargin:'-15% 0px -35% 0px',threshold:0});
      chapters.forEach(([id])=>{const section=document.getElementById(id);if(section)observer.observe(section);});
    }
  }

  function setupStudy() {
    const root=document.querySelector('[data-material-study]');if(!root)return;
    root.querySelectorAll('fieldset').forEach(fieldset=>{fieldset.disabled=false;});
    const state={metal:'Yellow Gold',finish:'High Polish',light:'Daylight'};
    const start=root.querySelector('[data-study-start]');
    const viewer=root.querySelector('[data-study-viewer]');
    const invitation=root.querySelector('[data-study-invitation]');
    const status=root.querySelector('[data-study-status]');
    const rotate=root.querySelector('[data-study-rotate]');
    let studio=null,loading=false,canvas=root.querySelector('canvas'),controller=null,generation=0;
    const update=()=>{
      const finish=state.finish==='High Polish'?'Mirror polish':'Soft satin';
      root.querySelector('[data-study-selection]').textContent=state.metal+' · '+finish;
      const url=new URL('/customs.html',location.origin);
      Object.entries({piece:'Ring',shape:'Round',size:'1',stone:'Clear Diamond',metal:state.metal,karat:'18K',finish:state.finish,lighting:state.light==='Evening'?'Candlelight':'Daylight',setting:'Bezel',band:'Solitaire',halo:'0',accent:'0'}).forEach(([key,value])=>url.searchParams.set(key,value));
      url.hash='design-studio';root.querySelector('[data-study-continue]').href=url.href;
      studio?.update(state);
    };
    ['metal','finish','light'].forEach(name=>root.querySelectorAll('[data-study-'+name+']').forEach(button=>button.addEventListener('click',()=>{
      state[name]=button.dataset['study'+name[0].toUpperCase()+name.slice(1)];
      root.querySelectorAll('[data-study-'+name+']').forEach(choice=>choice.setAttribute('aria-pressed',String(choice===button)));
      update();
      if(!studio&&!loading)status.textContent='Your choices are ready. Open the study to see them in 3D.';
    })));
    const failed=()=>{
      const restoreFocus=viewer.contains(document.activeElement)||document.activeElement===start;
      studio?.destroy();studio=null;
      root.dataset.studyState='fallback';viewer.hidden=true;invitation.hidden=false;start.disabled=false;start.textContent='Try the 3D study again';
      status.textContent='3D is unavailable right now. Your choices still carry into the design studio.';
      if(restoreFocus)start.focus({preventScroll:true});
    };
    start.hidden=false;
    start.addEventListener('click',async()=>{
      if(loading)return;loading=true;start.disabled=true;start.textContent='Preparing the atelier…';status.textContent='Loading the light and materials.';root.dataset.studyState='loading';
      const request=++generation;
      controller=new AbortController();
      const {signal}=controller;
      const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;
      viewer.hidden=false;
      try{
        const module=await import('/assets/js/material-study.js?v=20260914-atelier');
        signal.throwIfAborted();
        const created=await module.createMaterialStudy(canvas,failed,{signal});
        if(request!==generation){created.destroy();return;}
        studio=created;update();
        root.dataset.studyState='ready';invitation.hidden=true;status.textContent='';
        rotate.setAttribute('aria-pressed',String(!reduced.matches));
        rotate.disabled=reduced.matches;
        canvas.focus({preventScroll:true});
      }catch{if(request===generation)failed();}finally{if(request===generation)loading=false;}
    });
    rotate.addEventListener('click',()=>{const enabled=rotate.getAttribute('aria-pressed')!=='true'&&!reduced.matches;rotate.setAttribute('aria-pressed',String(enabled));studio?.rotate(enabled);});
    root.querySelector('[data-study-reset]').addEventListener('click',()=>studio?.reset());
    root.querySelectorAll('[data-study-zoom]').forEach(button=>button.addEventListener('click',()=>studio?.zoom(Number(button.dataset.studyZoom))));
    const motionControls=()=>{
      rotate.disabled=reduced.matches;
      rotate.title=reduced.matches?'Automatic rotation is paused by your reduced motion preference.':'Pause or resume the turntable';
      if(reduced.matches){rotate.setAttribute('aria-pressed','false');studio?.rotate(false);}
    };
    reduced.addEventListener('change',motionControls);motionControls();
    // Free the optional context before starting the heavier full design studio.
    const leave=()=>{
      generation++;controller?.abort();controller=null;studio?.destroy();studio=null;loading=false;
      viewer.hidden=true;invitation.hidden=false;start.disabled=false;start.textContent='Open the 3D study';status.textContent='';root.dataset.studyState='idle';
    };
    root.querySelector('[data-study-continue]').addEventListener('click',event=>{if(!event.metaKey&&!event.ctrlKey&&!event.shiftKey)leave();});
    window.addEventListener('pagehide',leave);
    update();
  }
  document.addEventListener('DOMContentLoaded',()=>{entrances();setupEdit();setupStudy();});
})();

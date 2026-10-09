(() => {
  'use strict';

  const keys = {
    grid: document.getElementById('qs-grid'),
    query: document.getElementById('qs-query'),
    categoryRoot: document.getElementById('qs-categories'),
    deployment: document.getElementById('qs-deployment'),
    results: document.getElementById('qs-result-count'),
    empty: document.getElementById('qs-empty'),
    clear: document.getElementById('qs-clear'),
    total: document.getElementById('qs-total'),
    reviewed: document.getElementById('qs-review-date'),
    top: document.getElementById('qs-top')
  };

  const categories = {
    'drawing-takeoff': {name:'Drawing Takeoff',symbol:'⌖'},
    'bim-qto': {name:'BIM & IFC Quantities',symbol:'⬡'},
    'rates-estimating': {name:'BOQ & Rate Analysis',symbol:'∑'},
    'contract-controls': {name:'Contracts & Project Controls',symbol:'▤'},
    'automation': {name:'Automation Libraries',symbol:'{ }'},
    'survey-earthworks': {name:'Survey & Earthworks',symbol:'⌁'},
    'ai-skills-mcp': {name:'AI Skills & MCP',symbol:'✧'}
  };

  const state = {resources:[],category:'all',term:'',mode:'all'};
  const allowedModes = new Set(['Browser','Desktop','Self-hosted','Python','Add-on','SDK','AI Skill','MCP Server','Prompt Pack']);
  const label = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = String(value);
    return element;
  };

  function safeLink(href, title, className) {
    const anchor = label('a', className, title);
    const parsed = new URL(href);
    if (parsed.protocol !== 'https:') throw new Error('Invalid catalog URL');
    anchor.href = parsed.href;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    return anchor;
  }

  function validate(data) {
    if (!data || !Array.isArray(data.resources) || !Array.isArray(data.categories)) {
      throw new Error('The resource catalog is not in the expected format');
    }
    const allCategories = new Set(Object.keys(categories));
    const ids = new Set();
    for (const item of data.resources) {
      if (!item.id || ids.has(item.id) || !allCategories.has(item.category) ||
          !allowedModes.has(item.mode) || !item.name || !item.license ||
          !item.summary || !item.source) {
        throw new Error('Catalog contains invalid or duplicated resources');
      }
      if (new URL(item.source).hostname !== 'github.com') {
        throw new Error('Original GitHub source link is required');
      }
      if (item.demo && new URL(item.demo).protocol !== 'https:') {
        throw new Error('Demo URL must use HTTPS');
      }
      ids.add(item.id);
    }
    if (data.categories.length !== allCategories.size ||
        data.categories.some(entry => !allCategories.has(entry.id))) {
      throw new Error('Category definitions are inconsistent');
    }
    return data.resources;
  }

  function card(item) {
    const wrapper = label('article','qs-card');
    wrapper.setAttribute('role','listitem');
    const head = label('div','qs-card-top');
    const icon = label('span','qs-card-icon',categories[item.category].symbol);
    icon.setAttribute('aria-hidden','true');
    head.append(icon,label('span','qs-license',item.license));
    wrapper.append(head);

    wrapper.append(label('h3','',item.name));
    wrapper.append(label('span','qs-card-kind',categories[item.category].name));
    wrapper.append(label('p','',item.summary));
    if (Array.isArray(item.compatibleWith) && item.compatibleWith.length) {
      wrapper.append(label('p','qs-compat','Compatible: '+item.compatibleWith.join(' · ')));
    }
    wrapper.append(label('p','qs-card-note',item.caution));
    const bottom = label('div','qs-card-bottom');
    bottom.append(label('span','qs-platform',item.mode));
    const links = label('div','qs-card-links');
    links.append(safeLink(item.source,'Source ↗','qs-source'));
    if (item.demo) links.append(safeLink(item.demo,'Open demo ↗','qs-demo'));
    bottom.append(links);
    wrapper.append(bottom);
    return wrapper;
  }

  function render() {
    const term = state.term.trim().toLowerCase();
    const matched = state.resources.filter(item => {
      if (state.category !== 'all' && item.category !== state.category) return false;
      if (state.mode !== 'all' && item.mode !== state.mode) return false;
      if (!term) return true;
      const haystack = [item.name,item.category,item.summary,item.caution,item.license,item.mode,...(item.tags || []),...(item.compatibleWith || [])].join(' ').toLowerCase();
      return haystack.includes(term);
    }).sort((a,b) => (Number(b.featured) - Number(a.featured)) || a.name.localeCompare(b.name));
    const nodes = matched.map(card);
    keys.grid.replaceChildren(...nodes);
    keys.results.textContent = matched.length + ' of ' + state.resources.length + ' reviewed resources';
    keys.empty.hidden = matched.length !== 0;
  }

  function categoryControls() {
    keys.categoryRoot.replaceChildren();
    const entries = [{id:'all',label:'All tools'},...Object.entries(categories).map(([id,entry])=>({id,label:entry.name}))];
    for (const entry of entries) {
      const button = label('button','qs-chip'+(entry.id===state.category?' is-active':''),entry.label);
      button.type = 'button';
      button.dataset.category = entry.id;
      button.setAttribute('aria-pressed',String(entry.id===state.category));
      button.addEventListener('click',() => {
        state.category = entry.id;
        categoryControls();
        render();
      });
      keys.categoryRoot.append(button);
    }
  }

  function reset() {
    state.term = '';
    state.mode = 'all';
    state.category = 'all';
    keys.query.value = '';
    keys.deployment.value = 'all';
    categoryControls();
    render();
    keys.query.focus();
  }

  function scrollControl() {
    const refresh = () => {keys.top.hidden = window.scrollY <= 320;};
    window.addEventListener('scroll',refresh,{passive:true});
    keys.top.addEventListener('click',() => {
      window.scrollTo({top:0,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });
    refresh();
  }

  async function load() {
    keys.query.addEventListener('input',event=>{state.term=event.target.value;render();});
    keys.deployment.addEventListener('change',event=>{state.mode=event.target.value;render();});
    keys.clear.addEventListener('click',reset);
    document.getElementById('qs-year').textContent = String(new Date().getFullYear());
    scrollControl();

    try {
      const response = await fetch('/assets/estimating-resources.json', {cache:'no-store'});
      if (!response.ok) throw new Error('Catalog service returned HTTP '+response.status);
      const data = await response.json();
      state.resources = validate(data);
      keys.total.textContent = String(state.resources.length).padStart(2,'0');
      keys.reviewed.textContent = 'Sources checked ' + data.checkedOn;
      categoryControls();
      render();
    } catch (error) {
      keys.grid.replaceChildren();
      keys.results.textContent = 'The resource directory is temporarily unavailable.';
      keys.empty.hidden = false;
      keys.empty.querySelector('strong').textContent = 'Could not load the index';
      keys.empty.querySelector('p').textContent = 'Check the source catalog on GitHub or retry after refreshing this page.';
      keys.clear.textContent = 'Try again';
      keys.clear.addEventListener('click',() => window.location.reload(),{once:true});
      console.warn('QS resource catalog could not load:',error);
    }
  }

  load();
})();

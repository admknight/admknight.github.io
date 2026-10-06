const USER = "admknight";
const API = "https://api.github.com";
const EXCLUDED = new Set(["admknight.github.io"]);
let repos = [];

const $ = id => document.getElementById(id);

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[c]));
}

function compact(n) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
}

function dateLabel(value) {
  if (!value) return "Unknown";
  const d = new Date(value);
  const diff = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return diff + "d ago";
  return d.toLocaleDateString("en", { month: "short", year: "numeric" });
}

function animateNumber(el, target, formatter = n => String(Math.round(n))) {
  if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (el) el.textContent = formatter(target);
    return;
  }
  const start = performance.now();
  const duration = 850;
  function step(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = formatter(target * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function observeReveals() {
  const items = document.querySelectorAll(".section:not(.reveal), .metrics:not(.reveal), .repo-card:not(.reveal), .activity-row:not(.reveal)");
  items.forEach(el => el.classList.add("reveal"));
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    items.forEach(el => el.classList.add("visible"));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(el => observer.observe(el));
}

function bindPointerGlow() {
  document.querySelectorAll(".repo-card").forEach(card => {
    if (card.dataset.glowBound) return;
    card.dataset.glowBound = "1";
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", (e.clientX - r.left) + "px");
      card.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });
  const featured = document.querySelector(".featured-card");
  if (featured && !featured.dataset.glowBound) {
    featured.dataset.glowBound = "1";
    featured.addEventListener("pointermove", e => {
      const r = featured.getBoundingClientRect();
      featured.style.setProperty("--fx", (e.clientX - r.left) + "px");
      featured.style.setProperty("--fy", (e.clientY - r.top) + "px");
    });
  }
}

function render(list) {
  const grid = $("repo-grid");
  const msg = $("repo-message");
  if (!list.length) {
    grid.innerHTML = "";
    msg.hidden = false;
    msg.textContent = "No repositories match this search.";
    return;
  }
  msg.hidden = true;
  grid.innerHTML = list.map(repo => {
    const desc = repo.description || "Public GitHub repository by Adam Knight.";
    const lang = repo.language ? `
      <span class="repo-language"><span class="language-dot"></span>${esc(repo.language)}</span>` : "";
    const flags = [
      repo.fork ? '<span class="repo-tag">Fork</span>' : "",
      repo.archived ? '<span class="repo-tag">Archived</span>' : ""
    ].join("");
    return `
      <a class="repo-card" href="${esc(repo.html_url)}" target="_blank" rel="noreferrer">
        <div class="repo-top">
          <span class="repo-name">${esc(repo.name)}</span>
          <span class="repo-arrow">↗</span>
        </div>
        <p class="repo-description">${esc(desc)}</p>
        <div class="repo-meta">
          ${lang}
          <span>★ ${compact(repo.stargazers_count)}</span>
          <span>⑂ ${compact(repo.forks_count)}</span>
          <span>Updated ${dateLabel(repo.updated_at)}</span>
        </div>
        ${flags ? '<div class="repo-flags">' + flags + '</div>' : ""}
      </a>`;
  }).join("");
  observeReveals();
  bindPointerGlow();
}

function renderActivity() {
  const box = $("activity-list");
  if (!box) return;
  const recent = [...repos]
    .sort((a,b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
    .slice(0,5);
  box.innerHTML = recent.map(repo => `
    <a class="activity-row" href="${esc(repo.html_url)}" target="_blank" rel="noreferrer">
      <div class="activity-main">
        <div class="activity-name"><span class="status-ok">●</span> ${esc(repo.name)}</div>
        <p class="activity-description">${esc(repo.description || "Public GitHub repository by Adam Knight.")}</p>
      </div>
      <span class="activity-time">${dateLabel(repo.updated_at)}</span>
    </a>
  `).join("");
  observeReveals();
}

function applyFilters() {
  const q = $("repo-search").value.trim().toLowerCase();
  const sort = $("repo-sort").value;
  let list = repos.filter(r => {
    const text = (r.name + " " + (r.description || "") + " " + (r.language || "")).toLowerCase();
    return !q || text.includes(q);
  });
  list.sort((a,b) => {
    if (sort === "stars") return (b.stargazers_count || 0) - (a.stargazers_count || 0) || a.name.localeCompare(b.name);
    if (sort === "name") return a.name.localeCompare(b.name);
    return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
  });
  render(list);
}

async function loadRepos() {
  try {
    const res = await fetch(`${API}/users/${USER}/repos?per_page=100&sort=updated&type=owner`, {
      headers: { "Accept": "application/vnd.github+json" }
    });
    if (!res.ok) throw new Error("GitHub API returned " + res.status);
    const data = await res.json();
    repos = data.filter(r => !r.private && !EXCLUDED.has(r.name));
    const stars = repos.reduce((sum,r) => sum + (r.stargazers_count || 0), 0);

    $("repo-count").textContent = repos.length;
    $("star-count").textContent = compact(stars);
    animateNumber($("metric-repos"), repos.length);
    animateNumber($("metric-stars"), stars, compact);
    $("metric-updated").textContent = repos[0] ? dateLabel(repos[0].updated_at) : "—";

    renderActivity();
    applyFilters();
  } catch (err) {
    console.error(err);
    $("repo-grid").innerHTML = "";
    $("repo-message").hidden = false;
    $("repo-message").innerHTML = 'GitHub repository data is temporarily unavailable. <a href="https://github.com/admknight?tab=repositories">Browse repositories on GitHub ↗</a>';
    if ($("activity-status")) $("activity-status").innerHTML = "GitHub data unavailable";
  }
}

async function loadMegaRepoStats() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/admknight/CloudstreamExtensions/builds/merge-report.json", { cache: "no-store" });
    if (res.ok) {
      const report = await res.json();
      if (report.uniquePlugins != null) animateNumber($("cs-plugins"), report.uniquePlugins);
      if (report.sourceHealth?.ok != null) animateNumber($("cs-sources"), report.sourceHealth.ok);
      if (report.packageHealth?.failed != null) animateNumber($("cs-failures"), report.packageHealth.failed);
    }
  } catch (e) { console.debug("Mega Repo stats unavailable", e); }

  try {
    const res = await fetch("https://raw.githubusercontent.com/admknight/CloudstreamExtensions/custom-builds/plugins.json", { cache: "no-store" });
    if (res.ok) {
      const custom = await res.json();
      if (Array.isArray(custom)) animateNumber($("cs-custom"), custom.length);
    }
  } catch (e) { console.debug("Custom provider count unavailable", e); }
}

function runTerminalTyping() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const lines = [...document.querySelectorAll(".type-line")];
  let delay = 250;
  lines.forEach(line => {
    const text = line.dataset.text || line.textContent;
    line.textContent = "";
    line.classList.add("typing");
    setTimeout(() => {
      let i = 0;
      const timer = setInterval(() => {
        line.textContent = text.slice(0, ++i);
        if (i >= text.length) {
          clearInterval(timer);
          line.classList.remove("typing");
        }
      }, 38);
    }, delay);
    delay += Math.max(600, text.length * 38 + 350);
  });
}

function updateScrollProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const pct = max > 0 ? (scrollY / max) * 100 : 0;
  $("scroll-progress").style.width = pct + "%";
}

$("repo-search").addEventListener("input", applyFilters);
$("repo-sort").addEventListener("change", applyFilters);
$("year").textContent = new Date().getFullYear();
addEventListener("scroll", updateScrollProgress, { passive: true });

observeReveals();
bindPointerGlow();
runTerminalTyping();
loadRepos();
loadMegaRepoStats();
updateScrollProgress();

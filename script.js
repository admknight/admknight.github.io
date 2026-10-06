const USER = "admknight";
const API = "https://api.github.com";
const EXCLUDED = new Set(["admknight.github.io"]);

let repos = [];

const $ = (id) => document.getElementById(id);

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
      <a class="repo-card" href="${esc(repo.html_url)}" target="_blank" rel="noreferrer"
         data-name="${esc(repo.name.toLowerCase())}" data-description="${esc(desc.toLowerCase())}">
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
    $("metric-repos").textContent = repos.length;
    $("metric-stars").textContent = compact(stars);
    $("metric-updated").textContent = repos[0] ? dateLabel(repos[0].updated_at) : "—";
    applyFilters();
  } catch (err) {
    console.error(err);
    $("repo-grid").innerHTML = "";
    $("repo-message").hidden = false;
    $("repo-message").innerHTML = 'GitHub repository data is temporarily unavailable. <a href="https://github.com/admknight?tab=repositories">Browse repositories on GitHub ↗</a>';
  }
}

async function loadMegaRepoStats() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/admknight/CloudstreamExtensions/builds/merge-report.json", { cache: "no-store" });
    if (res.ok) {
      const report = await res.json();
      if (report.uniquePlugins != null) $("cs-plugins").textContent = report.uniquePlugins;
      if (report.sourceHealth?.ok != null) $("cs-sources").textContent = report.sourceHealth.ok;
      if (report.packageHealth?.failed != null) $("cs-failures").textContent = report.packageHealth.failed;
    }
  } catch (e) { console.debug("Mega Repo stats unavailable", e); }

  try {
    const res = await fetch("https://raw.githubusercontent.com/admknight/CloudstreamExtensions/custom-builds/plugins.json", { cache: "no-store" });
    if (res.ok) {
      const custom = await res.json();
      if (Array.isArray(custom)) $("cs-custom").textContent = custom.length;
    }
  } catch (e) { console.debug("Custom provider count unavailable", e); }
}

$("repo-search").addEventListener("input", applyFilters);
$("repo-sort").addEventListener("change", applyFilters);
$("year").textContent = new Date().getFullYear();

loadRepos();
loadMegaRepoStats();

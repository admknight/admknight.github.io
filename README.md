# admknight.github.io

Source for **https://admknight.github.io/** — the public project hub for Adam Knight.

## What the site does

- Features selected projects, currently led by **Adam Knight Mega Repo**.
- Loads public repositories directly from the GitHub API.
- Shows repository language, stars, forks, and update activity.
- Pulls live CloudStream Mega Repo health/catalog counts.
- Includes responsive styling, SEO metadata, `robots.txt`, and a sitemap.
- Links project-specific pages such as **https://admknight.github.io/CloudstreamExtensions/**.

## Featured MegaRepo experience

The portfolio's featured section is an interactive three-route showcase, with a one-click full-repository shortcode, direct links to the personal builder and discovery-only Explorer, and counts from the published GitHub catalog report. This changes presentation only: the full repository, builder, and Explorer remain separate services.

Three tools with different outputs: the **Full MegaRepo** is the entire catalog, the **Personal Repository Builder** generates a selected-only repository URL, and the **Extension Explorer** is discovery/bookmarks only. Adding a repository to CloudStream never installs individual plugins automatically.

- **[Full MegaRepo](https://admknight.github.io/CloudstreamExtensions/#install-full):** add the `admknight` repository to CloudStream to access the full catalog, then install individual extensions.
- **[Personal Repository Builder](https://adam-cloudstream-bundles.badass-insane.workers.dev/):** choose up to 100 extensions and generate a personal installable repository URL. Plugins are not installed automatically.
- **[Extension Explorer](https://admknight.github.io/CloudstreamExtensions/explore.html):** search, filter, and bookmark extension names. Bookmarks are local reference notes, not installable repositories.

The project also runs guarded aggregation every three hours and a separate read-only hourly package-integrity audit.

## Updating

The repository directory is dynamic, so newly created public GitHub repositories appear automatically without editing the page.

Major featured projects can be added manually to `index.html`.

## Files

- `index.html` — page structure and SEO metadata
- `styles.css` — responsive visual design
- `script.js` — GitHub repository loading and live project stats
- `robots.txt` — crawler directives
- `sitemap.xml` — root site sitemap

Built and maintained by **Adam Knight**.

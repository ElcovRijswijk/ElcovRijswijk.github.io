(() => {
  const grid = document.getElementById("project-grid");
  const filterBar = document.getElementById("filters");
  let projects = [];
  let activeTag = "All";

  fetch("data/projects.json")
    .then((r) => {
      if (!r.ok) throw new Error("projects.json not found");
      return r.json();
    })
    .then((data) => {
      projects = Array.isArray(data) ? data : [];
      renderFilters();
      render();
    })
    .catch(() => {
      grid.textContent = "Could not load projects. Serve the site over http (not file://).";
    });

  function renderFilters() {
    const tags = ["All", ...new Set(projects.flatMap((p) => p.tags || []))];
    filterBar.replaceChildren(
      ...tags.map((tag) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.textContent = tag;
        btn.setAttribute("aria-pressed", String(tag === activeTag));
        btn.addEventListener("click", () => {
          activeTag = tag;
          renderFilters();
          render();
        });
        return btn;
      })
    );
  }

  function render() {
    const visible = projects.filter(
      (p) => activeTag === "All" || (p.tags || []).includes(activeTag)
    );
    grid.replaceChildren(...visible.map(card));
  }

  function card(p) {
    const article = document.createElement("article");
    article.className = "project reveal is-visible";

    if (p.image) {
      const img = document.createElement("img");
      img.className = "project-thumb";
      img.src = p.image;
      img.alt = p.title || "";
      img.loading = "lazy";
      img.addEventListener("error", () => {
        img.replaceWith(Object.assign(document.createElement("div"), { className: "project-thumb" }));
      });
      article.append(img);
    } else {
      const ph = document.createElement("div");
      ph.className = "project-thumb";
      article.append(ph);
    }

    const body = document.createElement("div");
    body.className = "project-body";

    const h2 = document.createElement("h2");
    h2.textContent = p.title || "Untitled";

    const desc = document.createElement("p");
    desc.textContent = p.description || "";

    const tagRow = document.createElement("div");
    tagRow.className = "tag-row";
    (p.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tagRow.append(span);
    });

    const links = document.createElement("div");
    links.className = "project-links";
    (p.links || []).forEach((l) => {
      const href = safeUrl(l.url);
      if (!href) return;
      const a = document.createElement("a");
      a.href = href;
      a.textContent = `${l.label || "Open"} ↗`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      links.append(a);
    });

    body.append(h2, desc, tagRow, links);
    article.append(body);
    return article;
  }

  // Only allow http(s) and same-origin relative links.
  function safeUrl(url) {
    if (typeof url !== "string" || !url.trim()) return null;
    try {
      const parsed = new URL(url, window.location.href);
      return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.href : null;
    } catch {
      return null;
    }
  }

  // Live counts from the official GitHub API (unauthenticated, no key needed).
  fetch("https://api.github.com/users/ElcovRijswijk")
    .then((r) => {
      if (!r.ok) throw new Error("GitHub API request failed");
      return r.json();
    })
    .then((user) => {
      const repos = document.getElementById("gh-repos");
      const followers = document.getElementById("gh-followers");
      const since = document.getElementById("gh-since");
      if (repos) repos.textContent = user.public_repos ?? "–";
      if (followers) followers.textContent = user.followers ?? "–";
      if (since && user.created_at) {
        const years = Math.max(1, new Date().getFullYear() - new Date(user.created_at).getFullYear());
        since.textContent = years;
      }
    })
    .catch(() => {
      const row = document.getElementById("github-stats");
      if (row) row.hidden = true;
    });
})();

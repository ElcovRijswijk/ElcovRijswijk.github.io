(() => {
  const TILES = {
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=cb1_2sre_1_958574d0bf6640783506549a",
  };
  const ATTRIBUTION =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

  const map = L.map("map", {
    center: [25, 10],
    zoom: 2,
    minZoom: 2,
    worldCopyJump: true,
    scrollWheelZoom: true,
  });

  L.tileLayer(TILES.dark, {
    attribution: ATTRIBUTION,
    maxZoom: 19,
  }).addTo(map);

  const cluster = L.markerClusterGroup({
    showCoverageOnHover: false,
    maxClusterRadius: 45,
  });
  map.addLayer(cluster);

  // Invisible-by-default country borders, lit up in yellow when a place/photo is selected.
  // 50m resolution (via topojson) gives far smoother coastlines than a plain 110m geojson.
  const COUNTRY_BORDERS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
  let countryLayer = null;
  let highlightedLayer = null;

  fetch(COUNTRY_BORDERS_URL)
    .then((r) => (r.ok ? r.json() : null))
    .then((topology) => {
      if (!topology) return;
      const geojson = topojson.feature(topology, topology.objects.countries);
      countryLayer = L.geoJSON(geojson, {
        interactive: false,
        style: { color: "transparent", weight: 0, fillOpacity: 0 },
      }).addTo(map);
    })
    .catch(() => {
      countryLayer = null;
    });

  function highlightCountry(countryName) {
    if (highlightedLayer) {
      highlightedLayer.setStyle({ color: "transparent", weight: 0, fillOpacity: 0, className: "" });
      highlightedLayer = null;
    }
    if (!countryLayer || !countryName) return;

    const target = countryName.trim().toLowerCase();
    let match = null;
    countryLayer.eachLayer((layer) => {
      if (match) return;
      const name = (layer.feature?.properties?.name || "").trim().toLowerCase();
      if (name === target || name.includes(target) || target.includes(name)) {
        match = layer;
      }
    });

    if (!match) return;
    match.setStyle({
      color: "#ffd60a",
      weight: 3,
      opacity: 1,
      fillColor: "#ffd60a",
      fillOpacity: 0.08,
      className: "country-glow",
    });
    match.bringToFront();
    highlightedLayer = match;
  }

  const listEl = document.getElementById("place-list");
  const searchEl = document.getElementById("place-search");
  const markers = new Map();
  let places = [];

  fetch("data/places.json")
    .then((r) => {
      if (!r.ok) throw new Error("places.json not found");
      return r.json();
    })
    .then((data) => {
      places = (Array.isArray(data) ? data : []).filter(
        (p) => typeof p.lat === "number" && typeof p.lng === "number"
      );
      buildMarkers();
      updateStats();
      renderList(places);
      fitMapToPlaces();
    })
    .catch(() => {
      listEl.textContent = "Could not load places.json. Serve the site over http (not file://).";
    });

  function buildMarkers() {
    places.forEach((place, index) => {
      const marker = L.marker([place.lat, place.lng], {
        title: place.name,
        icon: L.divIcon({
          className: "",
          html: '<div class="pin"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
      });
      marker.bindPopup(() => popupContent(place, index), { maxWidth: 280 });
      marker.on("click", () => flyTo(index));
      markers.set(index, marker);
      cluster.addLayer(marker);
    });
  }

  function fitMapToPlaces() {
    if (!places.length) return;
    const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lng]));
    const isMobile = window.matchMedia("(max-width: 860px)").matches;
    const padding = isMobile ? [24, 24] : [48, 48];
    map.fitBounds(bounds, {
      paddingTopLeft: padding,
      paddingBottomRight: padding,
      maxZoom: isMobile ? 3 : 4,
      animate: false,
    });
  }

  function popupContent(place, index) {
    const wrap = document.createElement("div");

    const title = document.createElement("h3");
    title.className = "popup-title";
    title.textContent = place.name || "Unnamed place";

    const meta = document.createElement("p");
    meta.className = "popup-meta";
    meta.textContent = [place.country, place.date].filter(Boolean).join(" · ");

    wrap.append(title, meta);

    const photos = place.photos || [];
    if (photos.length) {
      const gallery = document.createElement("div");
      gallery.className = "popup-photos";
      photos.forEach((photo, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        const img = document.createElement("img");
        img.src = photo.thumb || photo.src;
        img.alt = photo.caption || place.name || "";
        img.loading = "lazy";
        img.addEventListener("error", () => btn.remove());
        btn.append(img);
        btn.addEventListener("click", () => openLightbox(index, i));
        gallery.append(btn);
      });
      wrap.append(gallery);
    }

    if (place.note) {
      const note = document.createElement("p");
      note.className = "popup-note";
      note.textContent = place.note;
      wrap.append(note);
    }
    return wrap;
  }

  function renderList(items) {
    const grouped = new Map();
    items.forEach((place) => {
      const continent = continentFromCoordinates(place.lat, place.lng);
      if (!grouped.has(continent)) grouped.set(continent, []);
      grouped.get(continent).push(place);
    });

    const continentOrder = ["Africa", "Asia", "Europe", "North America", "South America", "Oceania", "Antarctica"];
    const groups = [...grouped.entries()].sort(
      ([first], [second]) => continentOrder.indexOf(first) - continentOrder.indexOf(second)
    );

    listEl.replaceChildren(
      ...groups.map(([continent, continentPlaces]) => {
        const details = document.createElement("details");
        details.className = "continent-group";

        const summary = document.createElement("summary");
        summary.innerHTML = `<span>${continent}</span><span class="continent-count">${continentPlaces.length}</span>`;
        details.append(summary);

        details.addEventListener("toggle", () => {
          if (!details.open) return;
          listEl.querySelectorAll(".continent-group[open]").forEach((other) => {
            if (other !== details) other.open = false;
          });
        });

        const placesList = document.createElement("ul");
        placesList.className = "continent-places";
        placesList.replaceChildren(...continentPlaces.map((place) => {
        const index = places.indexOf(place);
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "place-item";

        const cover = (place.photos || [])[0];
        if (cover) {
          const img = document.createElement("img");
          img.src = cover.thumb || cover.src;
          img.alt = "";
          img.loading = "lazy";
          img.addEventListener("error", () => img.remove());
          btn.append(img);
        }

        const text = document.createElement("span");
        const name = document.createElement("span");
        name.className = "pi-name";
        name.textContent = place.name || "Unnamed place";
        const metaLine = document.createElement("span");
        metaLine.className = "pi-meta";
        metaLine.textContent = [place.country, `${(place.photos || []).length} photos`]
          .filter(Boolean)
          .join(" · ");
        text.append(name, document.createElement("br"), metaLine);
        btn.append(text);

        btn.addEventListener("click", () => flyTo(index));
        li.append(btn);
        return li;
        }));
        details.append(placesList);
        return details;
      })
    );
  }

  function continentFromCoordinates(latitude, longitude) {
    if (latitude < -60) return "Antarctica";
    if (latitude < 15 && longitude >= -90 && longitude <= -30) return "South America";
    if (latitude >= 7 && longitude >= -170 && longitude <= -25) return "North America";
    if (latitude >= 30 && latitude <= 35 && longitude >= -18 && longitude <= -13) return "Europe";
    if (latitude >= -35 && latitude <= 38 && longitude >= -20 && longitude <= 52) return "Africa";
    if (latitude >= 35 && latitude <= 72 && longitude >= -25 && longitude <= 45) return "Europe";
    if (latitude >= -10 && longitude >= 45 && longitude <= 180) return "Asia";
    if (latitude <= 0 && longitude >= 110) return "Oceania";
    if (longitude < -25) return "North America";
    if (longitude >= 110) return "Oceania";
    return "Asia";
  }

  function flyTo(index) {
    const marker = markers.get(index);
    if (!marker) return;
    map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 7), { duration: 1.1 });
    cluster.zoomToShowLayer(marker, () => marker.openPopup());
    highlightCountry(places[index]?.country);
  }

  function updateStats() {
    const photoCount = places.reduce((sum, p) => sum + (p.photos || []).length, 0);
    document.getElementById("stat-places").textContent = String(places.length);
    document.getElementById("stat-photos").textContent = String(photoCount);
  }

  if (searchEl) {
    searchEl.addEventListener("input", () => {
      const q = searchEl.value.trim().toLowerCase();
      renderList(
        places.filter((p) =>
          `${p.name || ""} ${p.country || ""}`.toLowerCase().includes(q)
        )
      );
    });
  }

  /* ---------- lightbox ---------- */
  const lightbox = document.getElementById("lightbox");
  const lbImage = document.getElementById("lb-image");
  const lbCaption = document.getElementById("lb-caption");
  let current = { place: 0, photo: 0 };

  function openLightbox(placeIndex, photoIndex) {
    current = { place: placeIndex, photo: photoIndex };
    showPhoto();
    lightbox.hidden = false;
    highlightCountry(places[placeIndex]?.country);
  }

  function showPhoto() {
    const photo = (places[current.place].photos || [])[current.photo];
    if (!photo) return;
    lbImage.src = photo.src || photo.thumb;
    lbImage.alt = photo.caption || places[current.place].name || "";
    lbCaption.textContent = [photo.caption, places[current.place].name]
      .filter(Boolean)
      .join(" — ");
  }

  function step(delta) {
    const photos = places[current.place].photos || [];
    if (photos.length < 2) return;
    current.photo = (current.photo + delta + photos.length) % photos.length;
    showPhoto();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lbImage.removeAttribute("src");
  }

  lightbox.querySelector(".lb-close").addEventListener("click", closeLightbox);
  lightbox.querySelector(".lb-next").addEventListener("click", () => step(1));
  lightbox.querySelector(".lb-prev").addEventListener("click", () => step(-1));
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  });
})();

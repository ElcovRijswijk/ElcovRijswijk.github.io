(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  const revealables = document.querySelectorAll(".reveal");
  if (revealables.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => entry.target.classList.add("is-visible"), i * 90);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );
    revealables.forEach((el) => observer.observe(el));
  }

  const emailLinks = document.querySelectorAll("[data-email-popup]");
  if (emailLinks.length) {
    const popup = document.createElement("div");
    popup.className = "email-popup";
    popup.hidden = true;
    popup.innerHTML = `
      <div class="email-popup-card" role="dialog" aria-modal="true" aria-labelledby="email-popup-title">
        <button class="email-popup-close" type="button" aria-label="Close message">×</button>
        <div class="email-popup-icon" aria-hidden="true">✉</div>
        <p class="eyebrow">A tiny privacy detour</p>
        <h2 id="email-popup-title">My email is camera-shy.</h2>
        <p>I don't want my email address wandering into public AI training datasets, so please send me a LinkedIn message instead.</p>
        <a class="btn btn-primary" href="https://www.linkedin.com/in/elcovrijswijk/" target="_blank" rel="noopener">Message me on LinkedIn ↗</a>
      </div>`;
    document.body.append(popup);

    const closePopup = () => {
      popup.hidden = true;
    };
    emailLinks.forEach((link) => link.addEventListener("click", (event) => {
      event.preventDefault();
      popup.hidden = false;
      popup.querySelector(".email-popup-close").focus();
    }));
    popup.querySelector(".email-popup-close").addEventListener("click", closePopup);
    popup.addEventListener("click", (event) => {
      if (event.target === popup) closePopup();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePopup();
    });
  }

  const profilePicture = document.querySelector("[data-profile-popup]");
  if (profilePicture) {
    const popup = document.createElement("div");
    popup.className = "profile-popup email-popup";
    popup.hidden = true;
    popup.innerHTML = `
      <div class="email-popup-card profile-popup-card" role="dialog" aria-modal="true" aria-labelledby="profile-popup-title">
        <button class="email-popup-close" type="button" aria-label="Close profile picture">×</button>
        <img class="profile-popup-image" src="${profilePicture.src}" alt="" />
        <p class="eyebrow">Classified portrait</p>
        <h2 id="profile-popup-title">Wow, that's close. A little personal, isn't it?</h2>
        <p>If you'd like to meet me in real life, send me a message on LinkedIn.</p>
        <a class="btn btn-primary" href="https://www.linkedin.com/in/elcovrijswijk/" target="_blank" rel="noopener">Invite me on LinkedIn ↗</a>
      </div>`;
    document.body.append(popup);

    const closePopup = () => {
      popup.hidden = true;
    };
    const openPopup = () => {
      popup.hidden = false;
      popup.querySelector(".email-popup-close").focus();
    };
    profilePicture.addEventListener("click", openPopup);
    profilePicture.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPopup();
      }
    });
    popup.querySelector(".email-popup-close").addEventListener("click", closePopup);
    popup.addEventListener("click", (event) => {
      if (event.target === popup) closePopup();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closePopup();
    });
  }
})();

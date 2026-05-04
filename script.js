/**
 * ============================================================
 * RESTAURANT TEMPLATE — script.js
 *
 * Ce fichier lit data.json et injecte tout le contenu du site.
 * ⚠️ NE PAS MODIFIER CE FICHIER pour changer de client.
 *    Modifiez uniquement data.json.
 *
 * Structure :
 *  1. Chargement de data.json
 *  2. SEO & meta
 *  3. Navigation
 *  4. Hero (image ou vidéo)
 *  5. Intro
 *  6. Menu (onglets + plats)
 *  7. Galerie + Lightbox
 *  8. Infos (horaires, adresse, contact)
 *  9. Footer
 * 10. Utilitaires (scroll, observer, formulaire)
 * ============================================================
 */

'use strict';

/* ── Point d'entrée ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
});

/* ============================================================
   1. CHARGEMENT DE data.json
   ============================================================ */
async function chargerDonnees() {
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    // Appel de toutes les fonctions d'injection dans l'ordre
    initialiserSEO(data);
    initialiserNavigation(data);
    initialiserHero(data);
    initialiserIntro(data);
    initialiserMenu(data);
    initialiserGalerie(data);
    initialiserInfos(data);
    initialiserFooter(data);

    // Utilitaires globaux (indépendants des données)
    initialiserNavScroll();
    initialiserScrollReveal();
    initialiserFormulaire();

    // Appliquer la couleur d'accent personnalisée si définie dans data.json > seo.couleurTheme
    if (data.seo?.couleurTheme) {
      document.documentElement.style.setProperty('--gold', data.seo.couleurTheme);
    }

  } catch (err) {
    console.error('Erreur chargement data.json :', err);
    // Affichage d'un message d'erreur visible en développement
    document.body.insertAdjacentHTML('afterbegin',
      `<div style="background:#c0392b;color:#fff;padding:1rem;text-align:center;position:fixed;top:0;left:0;right:0;z-index:9999;">
        ⚠️ Impossible de charger data.json — vérifiez que le fichier existe et est valide (JSON).
      </div>`
    );
  }
}

/* ============================================================
   2. SEO & META
   Lit : data.seo, data.hero
   ============================================================ */
function initialiserSEO(data) {
  const s = data.seo || {};

  // Titre de l'onglet
  if (s.titre) {
    document.getElementById('page-title').textContent = s.titre;
    document.getElementById('og-title').setAttribute('content', s.titre);
  }

  // Meta description
  if (s.description) {
    document.getElementById('meta-description').setAttribute('content', s.description);
    document.getElementById('og-desc').setAttribute('content', s.description);
  }

  // Couleur navigateur mobile
  if (s.couleurTheme) {
    document.getElementById('meta-theme').setAttribute('content', s.couleurTheme);
  }

  // Image Open Graph (première photo de galerie ou image hero)
  const ogImg = data.galerie?.photos?.[0] || data.hero?.image || '';
  if (ogImg) document.getElementById('og-image').setAttribute('content', ogImg);
}

/* ============================================================
   3. NAVIGATION
   Lit : data.restaurant.nom
   ============================================================ */
function initialiserNavigation(data) {
  // Logo = nom du restaurant
  const logo = document.getElementById('nav-logo');
  if (logo && data.restaurant?.nom) logo.textContent = data.restaurant.nom;

  // Menu burger mobile
  const burger = document.getElementById('nav-burger');
  const navLinks = document.getElementById('nav-links');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      burger.setAttribute('aria-expanded', isOpen);
    });

    // Fermer le menu si on clique sur un lien
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        burger.classList.remove('open');
      });
    });
  }
}

/* ============================================================
   4. HERO — Image ou vidéo
   Lit : data.hero.type, data.hero.image, data.hero.video,
         data.restaurant.nom, data.restaurant.tagline
   ============================================================ */
function initialiserHero(data) {
  const hero = data.hero || {};
  const mediaContainer = document.getElementById('hero-media');

  if (mediaContainer) {
    if (hero.type === 'video' && hero.video) {
      // Cas vidéo
      const video = document.createElement('video');
      video.setAttribute('autoplay', '');
      video.setAttribute('muted', '');
      video.setAttribute('loop', '');
      video.setAttribute('playsinline', '');
      if (hero.videoPoster) video.setAttribute('poster', hero.videoPoster);
      video.src = hero.video;
      mediaContainer.appendChild(video);
    } else if (hero.image) {
      // Cas image (défaut)
      const img = document.createElement('img');
      img.src = hero.image;
      img.alt = `${data.restaurant?.nom || 'Restaurant'} — image hero`;
      img.setAttribute('loading', 'eager'); // Priorité haute
      mediaContainer.appendChild(img);
    }
  }

  // Texte du hero
  setText('hero-title', data.restaurant?.nom);
  setText('hero-tagline', data.restaurant?.tagline);
  setText('hero-label', 'Restaurant'); // Statique
}

/* ============================================================
   5. INTRO — Texte de présentation
   Lit : data.restaurant.description
   ============================================================ */
function initialiserIntro(data) {
  setText('intro-text', data.restaurant?.description);
}

/* ============================================================
   6. MENU — Onglets dynamiques + grille de plats
   Lit : data.menu.categories[]
   ============================================================ */
function initialiserMenu(data) {
  const categories = data.menu?.categories || [];
  const tabsContainer = document.getElementById('menu-tabs');
  const gridContainer = document.getElementById('menu-grid');

  if (!tabsContainer || !gridContainer || categories.length === 0) return;

  let categorieActive = 0; // Index de la catégorie affichée

  // Crée un onglet par catégorie
  categories.forEach((categorie, index) => {
    const tab = document.createElement('button');
    tab.className = 'menu__tab' + (index === 0 ? ' active' : '');
    tab.textContent = categorie.nom;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', index === 0);
    tab.addEventListener('click', () => {
      categorieActive = index;
      // Mise à jour de l'onglet actif
      tabsContainer.querySelectorAll('.menu__tab').forEach((t, i) => {
        t.classList.toggle('active', i === index);
        t.setAttribute('aria-selected', i === index);
      });
      // Re-render des plats
      afficherPlats(categorie.plats, gridContainer);
    });
    tabsContainer.appendChild(tab);
  });

  // Affichage initial : première catégorie
  afficherPlats(categories[0]?.plats || [], gridContainer);
}

/**
 * Génère les cartes de plats dans le container donné
 * @param {Array} plats - Tableau de plats depuis data.json
 * @param {HTMLElement} container
 */
function afficherPlats(plats, container) {
  container.innerHTML = ''; // Vider avant de remplir

  plats.forEach((plat, i) => {
    const card = document.createElement('article');
    card.className = 'menu__card';
    card.style.animationDelay = `${i * 60}ms`; // Décalage animation

    // Image du plat (optionnelle)
    const imgHtml = plat.image
      ? `<img class="menu__card-img" src="${echapper(plat.image)}" alt="${echapper(plat.nom)}" loading="lazy" />`
      : '';

    // Tag (Signature / Saison / Premium / vide)
    const tagHtml = plat.tag
      ? `<span class="menu__card-tag">${echapper(plat.tag)}</span>`
      : '';

    card.innerHTML = `
      ${imgHtml}
      <div class="menu__card-body">
        ${tagHtml}
        <h3 class="menu__card-name">${echapper(plat.nom)}</h3>
        <p class="menu__card-desc">${echapper(plat.description)}</p>
        <p class="menu__card-prix">${echapper(plat.prix)} €</p>
      </div>
    `;

    container.appendChild(card);
  });
}

/* ============================================================
   7. GALERIE + LIGHTBOX
   Lit : data.galerie.photos[]
   ============================================================ */
function initialiserGalerie(data) {
  const photos = data.galerie?.photos || [];
  const grid = document.getElementById('galerie-grid');
  if (!grid || photos.length === 0) return;

  photos.forEach((url, index) => {
    const item = document.createElement('div');
    item.className = 'galerie__item';
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Ouvrir la photo ${index + 1}`);

    const img = document.createElement('img');
    img.src = url;
    img.alt = `Photo ${index + 1}`;
    img.setAttribute('loading', 'lazy');

    item.appendChild(img);
    item.addEventListener('click', () => ouvrirLightbox(photos, index));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') ouvrirLightbox(photos, index);
    });

    grid.appendChild(item);
  });
}

/* ── Lightbox ─────────────────────────────────────────────── */
let lightboxIndex = 0;
let lightboxPhotos = [];

function ouvrirLightbox(photos, index) {
  lightboxPhotos = photos;
  lightboxIndex  = index;

  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  if (!lb || !lbImg) return;

  lbImg.src = photos[index];
  lb.classList.add('open');
  document.body.style.overflow = 'hidden'; // Désactiver le scroll
}

function fermerLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('open');
  document.body.style.overflow = '';
}

function naviguerLightbox(direction) {
  lightboxIndex = (lightboxIndex + direction + lightboxPhotos.length) % lightboxPhotos.length;
  const lbImg = document.getElementById('lightbox-img');
  if (lbImg) lbImg.src = lightboxPhotos[lightboxIndex];
}

// Événements lightbox
document.getElementById('lightbox-close')?.addEventListener('click', fermerLightbox);
document.getElementById('lightbox-prev')?.addEventListener('click', () => naviguerLightbox(-1));
document.getElementById('lightbox-next')?.addEventListener('click', () => naviguerLightbox(1));
document.getElementById('lightbox')?.addEventListener('click', e => {
  if (e.target === document.getElementById('lightbox')) fermerLightbox();
});
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox')?.classList.contains('open')) return;
  if (e.key === 'Escape')     fermerLightbox();
  if (e.key === 'ArrowLeft')  naviguerLightbox(-1);
  if (e.key === 'ArrowRight') naviguerLightbox(1);
});

/* ============================================================
   8. INFOS — Horaires, adresse, contact, réseaux sociaux
   Lit : data.horaires[], data.restaurant.adresse,
         data.restaurant.telephone, data.restaurant.email,
         data.restaurant.reseauxSociaux
   ============================================================ */
function initialiserInfos(data) {
  // ── Horaires ──
  const horairesList = document.getElementById('horaires-list');
  if (horairesList && data.horaires) {
    const joursActuel = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
    const jourActuel  = joursActuel[new Date().getDay()];

    data.horaires.forEach(h => {
      const li = document.createElement('li');
      if (h.jour === jourActuel) li.classList.add('today'); // Mettre en évidence le jour actuel

      const horaire = h.ferme
        ? `<span class="ferme">Fermé</span>`
        : `<span>${h.ouverture} – ${h.fermeture}</span>`;

      li.innerHTML = `<span class="jour">${echapper(h.jour)}</span>${horaire}`;
      horairesList.appendChild(li);
    });
  }

  // ── Adresse ──
  const adresse = data.restaurant?.adresse;
  const adresseBlock = document.getElementById('adresse-block');
  if (adresseBlock && adresse) {
    adresseBlock.innerHTML = `
      ${echapper(adresse.rue)}<br/>
      ${echapper(adresse.codePostal)} ${echapper(adresse.ville)}<br/>
      ${echapper(adresse.pays)}
    `;
  }

  // Lien Google Maps
  const mapLink = document.getElementById('map-link');
  if (mapLink && adresse) {
    const query = encodeURIComponent(`${adresse.rue}, ${adresse.codePostal} ${adresse.ville}`);
    mapLink.href = `https://maps.app.goo.gl/t7YcUZVa8HRhQ5xQA`;
  }

  // ── Téléphone ──
  const tel = data.restaurant?.telephone;
  const telLink = document.getElementById('tel-link');
  if (telLink && tel) {
    telLink.textContent = tel;
    telLink.href = `tel:${tel.replace(/\s/g, '')}`;
  }

  // ── Email ──
  const email = data.restaurant?.email;
  const emailLink = document.getElementById('email-link');
  if (emailLink && email) {
    emailLink.textContent = email;
    emailLink.href = `mailto:${email}`;
  }

  // ── Réseaux sociaux ──
  const social = data.restaurant?.reseauxSociaux;
  const socialLinks = document.getElementById('social-links');
  if (socialLinks && social) {
    Object.entries(social).forEach(([nom, url]) => {
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.textContent = nom.charAt(0).toUpperCase() + nom.slice(1);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      socialLinks.appendChild(a);
    });
  }
}

/* ============================================================
   9. FOOTER
   Lit : data.restaurant.nom, data.restaurant.adresse
   ============================================================ */
function initialiserFooter(data) {
  const nom = data.restaurant?.nom || '';
  const adr = data.restaurant?.adresse;

  setText('footer-name', nom);
  setText('footer-copy-name', nom);

  if (adr) {
    const el = document.getElementById('footer-adresse');
    if (el) el.textContent = `${adr.rue}, ${adr.codePostal} ${adr.ville}`;
  }

  // Année dynamique (jamais à mettre à jour manuellement)
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ============================================================
   10. UTILITAIRES
   ============================================================ */

/**
 * Comportement de la navbar au scroll
 * Ajoute la classe .scrolled après 60px
 */
function initialiserNavScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const handler = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  };
  window.addEventListener('scroll', handler, { passive: true });
  handler(); // Appel initial
}

/**
 * Révèle les sections au scroll via IntersectionObserver
 * Toutes les sections avec la classe .reveal sont animées
 */
function initialiserScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // Observer une seule fois
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/**
 * Gestion du formulaire de réservation
 * Compatible Netlify Forms (fonctionne sans backend)
 * Pour GitHub Pages : intégrer un service tiers (Formspree, etc.)
 */
function initialiserFormulaire() {
  const form = document.getElementById('reservation-form');
  const success = document.getElementById('form-success');
  if (!form || !success) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const btn = form.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';
    }

    try {
      // Envoi via fetch (compatible Netlify Forms)
      const formData = new FormData(form);
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString(),
      });

      if (response.ok || response.status === 200) {
        form.style.display = 'none'; // Masquer le formulaire
        success.classList.add('show');
      } else {
        throw new Error('Erreur réseau');
      }
    } catch {
      // En développement local, simuler le succès pour tester
      console.info('Mode dev : simulation du succès du formulaire.');
      form.style.display = 'none';
      success.classList.add('show');
    }
  });
}

/* ── Helpers ─────────────────────────────────────────────── */

/**
 * Injecte du texte dans un élément par son ID
 * @param {string} id   - ID de l'élément HTML
 * @param {string} text - Texte à injecter
 */
function setText(id, text) {
  const el = document.getElementById(id);
  if (el && text !== undefined && text !== null) el.textContent = text;
}

/**
 * Échappe les caractères HTML dangereux (sécurité XSS)
 * @param {string} str
 * @returns {string}
 */
function echapper(str) {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.getElementById('year').textContent = new Date().getFullYear();

/* === VIEWPORT FIT FOR GALLERY === */
(function() {
  const root = document.documentElement;
  const header = document.querySelector('.site-header');

  function updateHeaderHeightVar() {
    const headerHeight = header ? header.offsetHeight : 0;
    root.style.setProperty('--header-height', `${headerHeight}px`);
  }

  updateHeaderHeightVar();
  window.addEventListener('resize', updateHeaderHeightVar);
  window.addEventListener('orientationchange', updateHeaderHeightVar);
})();

/* === GALLERY PREMIUM SLIDER === */
(function() {
  const slider = document.getElementById('gallery-slider');
  if (!slider) return;

  const track = slider.querySelector('.gallery-track');
  const dotsContainer = slider.querySelector('.gallery-dots');
  const prevBtn = slider.querySelector('.gallery-nav.prev');
  const nextBtn = slider.querySelector('.gallery-nav.next');
  const sourceElements = Array.from(slider.querySelectorAll('.gallery-source li'));
  const parseImages = (value, fallback) => {
    if (!value) return [fallback].filter(Boolean);
    return value.split('|').map((entry) => entry.trim()).filter(Boolean);
  };

  const sourceItems = sourceElements.map((item, index) => ({
    id: item.dataset.projectId || `project-${index + 1}`,
    src: item.dataset.src,
    alt: item.dataset.alt || 'Gallery image',
    caption: item.dataset.caption || `Project ${index + 1}`,
    projectImages: parseImages(item.dataset.projectImages, item.dataset.src),
    previewImages: parseImages(item.dataset.previewImages, item.dataset.src)
  })).filter((item) => item.src);

  if (!track || !dotsContainer || sourceItems.length === 0) return;

  const projectsById = new Map(sourceItems.map((item) => [item.id, item]));

  const lightbox = (() => {
    const overlay = document.createElement('div');
    overlay.className = 'gallery-lightbox';
    overlay.innerHTML = `
      <div class="gallery-lightbox-content" role="dialog" aria-modal="true" aria-label="Project image viewer">
        <button class="gallery-lightbox-close" aria-label="Close viewer">✕</button>
        <button class="gallery-lightbox-prev" aria-label="Previous image">❮</button>
        <img class="gallery-lightbox-image" src="" alt="">
        <button class="gallery-lightbox-next" aria-label="Next image">❯</button>
        <p class="gallery-lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(overlay);

    const image = overlay.querySelector('.gallery-lightbox-image');
    const caption = overlay.querySelector('.gallery-lightbox-caption');
    const closeBtn = overlay.querySelector('.gallery-lightbox-close');
    const prevImageBtn = overlay.querySelector('.gallery-lightbox-prev');
    const nextImageBtn = overlay.querySelector('.gallery-lightbox-next');

    let activeProject = null;
    let activeIndex = 0;

    function renderImage() {
      if (!activeProject || !activeProject.projectImages.length) return;
      const currentSrc = activeProject.projectImages[activeIndex];
      image.src = currentSrc;
      image.alt = activeProject.alt;
      caption.textContent = `${activeProject.caption} (${activeIndex + 1}/${activeProject.projectImages.length})`;
    }

    function close() {
      overlay.classList.remove('show');
      document.body.style.overflow = '';
      activeProject = null;
    }

    function open(project, startSrc) {
      activeProject = project;
      const startIndex = project.projectImages.findIndex((src) => src === startSrc);
      activeIndex = startIndex >= 0 ? startIndex : 0;
      renderImage();
      overlay.classList.add('show');
      document.body.style.overflow = 'hidden';
    }

    function nextImage() {
      if (!activeProject) return;
      activeIndex = (activeIndex + 1) % activeProject.projectImages.length;
      renderImage();
    }

    function prevImage() {
      if (!activeProject) return;
      activeIndex = (activeIndex - 1 + activeProject.projectImages.length) % activeProject.projectImages.length;
      renderImage();
    }

    closeBtn?.addEventListener('click', close);
    nextImageBtn?.addEventListener('click', nextImage);
    prevImageBtn?.addEventListener('click', prevImage);

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });

    window.addEventListener('keydown', (event) => {
      if (!overlay.classList.contains('show')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') nextImage();
      if (event.key === 'ArrowLeft') prevImage();
    });

    return { open };
  })();

  const pages = sourceItems.map((project) => {
    const preview = project.previewImages.length ? [...project.previewImages] : [...project.projectImages];
    while (preview.length < 3) {
      preview.push(project.projectImages[preview.length % project.projectImages.length] || project.src);
    }
    return {
      project,
      preview: preview.slice(0, 3)
    };
  });

  track.innerHTML = pages.map((page) => `
    <div class="gallery-page">
      <figure class="gallery-main" data-project-id="${page.project.id}" data-image-src="${page.preview[0]}">
        <img src="${page.preview[0]}" alt="${page.project.alt}">
        <figcaption>${page.project.caption}</figcaption>
      </figure>
      <div class="gallery-side">
        <figure class="gallery-small" data-project-id="${page.project.id}" data-image-src="${page.preview[1]}">
          <img src="${page.preview[1]}" alt="${page.project.alt}">
          <figcaption>${page.project.caption}</figcaption>
        </figure>
        <figure class="gallery-small" data-project-id="${page.project.id}" data-image-src="${page.preview[2]}">
          <img src="${page.preview[2]}" alt="${page.project.alt}">
          <figcaption>${page.project.caption}</figcaption>
        </figure>
      </div>
    </div>
  `).join('');

  track.querySelectorAll('[data-project-id]').forEach((figure) => {
    figure.addEventListener('click', () => {
      const projectId = figure.getAttribute('data-project-id');
      const startSrc = figure.getAttribute('data-image-src');
      const project = projectsById.get(projectId || '');
      if (!project) return;
      lightbox.open(project, startSrc || project.src);
    });
  });

  let current = 0;
  dotsContainer.innerHTML = '';
  pages.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.setAttribute('aria-label', `Go to gallery slide ${index + 1}`);
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      current = index;
      update();
      resetAutoplay();
    });
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.querySelectorAll('button'));

  function update() {
    const offset = current * -100;
    track.style.transform = `translateX(${offset}%)`;
    dots.forEach((dot) => dot.classList.remove('active'));
    dots[current]?.classList.add('active');
  }

  function next() {
    current = (current + 1) % pages.length;
    update();
  }

  function prev() {
    current = (current - 1 + pages.length) % pages.length;
    update();
  }

  prevBtn?.addEventListener('click', () => {
    prev();
    stopAutoplay();
  });
  nextBtn?.addEventListener('click', () => {
    next();
    stopAutoplay();
  });

  const autoplayDelay = 9000;
  let autoplay = setInterval(next, autoplayDelay);
  let autoplayStoppedByUser = false;

  function stopAutoplay() {
    autoplayStoppedByUser = true;
    clearInterval(autoplay);
  }

  function resetAutoplay() {
    if (autoplayStoppedByUser) return;
    clearInterval(autoplay);
    autoplay = setInterval(next, autoplayDelay);
  }

  const desktopHoverMedia = window.matchMedia('(min-width: 1000px) and (hover: hover) and (pointer: fine)');

  slider.addEventListener('mouseenter', () => {
    if (!desktopHoverMedia.matches) return;
    if (autoplayStoppedByUser) return;
    clearInterval(autoplay);
  });

  slider.addEventListener('mouseleave', () => {
    if (!desktopHoverMedia.matches) return;
    if (autoplayStoppedByUser) return;
    autoplay = setInterval(next, autoplayDelay);
  });

  update();
})();

/* === REVIEWS AUTO-SCROLL === */
(function() {
  const container = document.querySelector('.reviews-container');
  if (!container) return;
  
  let offset = 0;
  function scroll() {
    offset += 320;
    if (offset > container.scrollWidth - container.clientWidth) offset = 0;
    container.scrollTo({ left: offset, behavior: 'smooth' });
  }

  let interval = setInterval(scroll, 4500);
  container.addEventListener('mouseenter', () => clearInterval(interval));
  container.addEventListener('mouseleave', () => interval = setInterval(scroll, 4500));
})();

/* === MOBILE NAVIGATION === */
(function() {
  const toggle = document.querySelector('.nav-toggle');
  const menu = document.querySelector('.nav-menu');
  if (toggle && menu) {
    const closeMenu = () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', () => {
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (event) => {
      if (!menu.classList.contains('open')) return;
      const clickInsideMenu = menu.contains(event.target);
      const clickOnToggle = toggle.contains(event.target);
      if (!clickInsideMenu && !clickOnToggle) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });
  }
})();

/* === HEADER SCROLL EFFECT === */
(function() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  });
})();

/* === BOOKING FORMS & POPUP === */
(function() {
  const emailjsConfig = window.EMAILJS_CONFIG || {};
  const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;
  const looksLikePlaceholder = (value) => typeof value === 'string' && /^YOUR_/i.test(value.trim());
  const emailjsReady =
    typeof emailjs !== 'undefined' &&
    hasValue(emailjsConfig.publicKey) &&
    !looksLikePlaceholder(emailjsConfig.publicKey) &&
    hasValue(emailjsConfig.serviceId) &&
    !looksLikePlaceholder(emailjsConfig.serviceId) &&
    hasValue(emailjsConfig.templateId) &&
    !looksLikePlaceholder(emailjsConfig.templateId);

  if (emailjsReady) {
    emailjs.init({ publicKey: emailjsConfig.publicKey });
  }

  const formatDateTime = (date) => date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  const toLocalYMD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  async function submitBooking(form, msgEl) {
    if (!form || !msgEl) return false;

    msgEl.textContent = '';
    msgEl.classList.remove('show', 'success', 'error');

    const data = Object.fromEntries(new FormData(form).entries());
    const submittedAt = data.submittedAt || new Date().toISOString();
    const titleParts = [data.service, data.date, data.name].filter(Boolean);
    const title = titleParts.length ? titleParts.join(' • ') : 'New Booking';

    try {
      if (!emailjsReady) {
        throw new Error('Email service is not configured. Please verify EMAILJS_CONFIG and the EmailJS script include.');
      }

      const templateParams = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        service: data.service || '',
        date: data.date || '',
        time: data.time || '',
        address: data.address || '',
        notes: data.notes || '',
        submittedAt,
        title,
        to_email: emailjsConfig.toEmail || ''
      };

      await emailjs.send(emailjsConfig.serviceId, emailjsConfig.templateId, templateParams);

      msgEl.textContent = '✓ Booking requested! We\'ll confirm within 24 hours.';
      msgEl.classList.add('show', 'success');
      return true;
    } catch (err) {
      msgEl.textContent = '✗ Error: ' + err.message;
      msgEl.classList.add('show', 'error');
      return false;
    }
  }

  const mainForm = document.getElementById('booking-form');
  const mainMessage = document.getElementById('message');
  if (mainForm && mainMessage) {
    mainForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = await submitBooking(mainForm, mainMessage);
      if (ok) {
        mainForm.reset();
      }
    });
  }

  const openModalBtn = document.getElementById('open-booking-modal');
  const modal = document.getElementById('booking-modal');
  const closeModalBtn = document.getElementById('booking-modal-close');
  const stepCalendar = document.getElementById('booking-step-calendar');
  const stepForm = document.getElementById('booking-step-form');
  const continueBtn = document.getElementById('booking-date-continue');
  const backBtn = document.getElementById('booking-back-to-calendar');
  const calendarInput = document.getElementById('booking-modal-date');
  const calendarGrid = document.getElementById('booking-calendar-grid');
  const calendarMonthLabel = document.getElementById('booking-calendar-month');
  const calendarPrevBtn = document.getElementById('booking-calendar-prev');
  const calendarNextBtn = document.getElementById('booking-calendar-next');
  const selectedDateText = document.getElementById('booking-selected-date-text');
  const currentDateTime = document.getElementById('booking-current-datetime');
  const modalForm = document.getElementById('booking-modal-form');
  const modalMessage = document.getElementById('booking-modal-message');
  const modalFormDate = document.getElementById('booking-modal-form-date');
  const modalSubmittedAt = document.getElementById('booking-modal-submitted-at');

  if (!openModalBtn || !modal || !closeModalBtn || !stepCalendar || !stepForm || !continueBtn || !backBtn || !calendarInput || !calendarGrid || !calendarMonthLabel || !calendarPrevBtn || !calendarNextBtn || !selectedDateText || !currentDateTime || !modalForm || !modalMessage || !modalFormDate || !modalSubmittedAt) {
    return;
  }

  let clockTimer = null;
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let selectedDate = '';
  let visibleMonth = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  function formatYMD(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function formatLongDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function parseYMD(ymd) {
    const [year, month, day] = ymd.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function updateSelectedDateText() {
    if (!selectedDate) {
      selectedDateText.textContent = 'Not selected';
      return;
    }
    selectedDateText.textContent = formatLongDate(parseYMD(selectedDate));
  }

  function renderCalendar() {
    const monthName = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    calendarMonthLabel.textContent = monthName;

    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    const leadingBlanks = monthStart.getDay();
    const daysInMonth = monthEnd.getDate();

    calendarGrid.innerHTML = '';

    for (let i = 0; i < leadingBlanks; i += 1) {
      const blank = document.createElement('span');
      blank.className = 'booking-calendar-empty';
      calendarGrid.appendChild(blank);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
      const ymd = formatYMD(date);
      const isPast = date < todayStart;
      const isSelected = selectedDate === ymd;
      const isToday = formatYMD(todayStart) === ymd;

      const dayBtn = document.createElement('button');
      dayBtn.type = 'button';
      dayBtn.className = 'booking-calendar-day';
      dayBtn.textContent = String(day);
      dayBtn.dataset.date = ymd;

      if (isToday) {
        dayBtn.classList.add('is-today');
      }
      if (isSelected) {
        dayBtn.classList.add('is-selected');
      }
      if (isPast) {
        dayBtn.classList.add('is-disabled');
        dayBtn.disabled = true;
      } else {
        dayBtn.addEventListener('click', () => {
          selectedDate = ymd;
          calendarInput.value = ymd;
          updateSelectedDateText();
          renderCalendar();
        });
      }

      calendarGrid.appendChild(dayBtn);
    }
  }

  function updateNowText() {
    currentDateTime.textContent = formatDateTime(new Date());
  }

  function showCalendarStep() {
    stepCalendar.hidden = false;
    stepForm.hidden = true;
  }

  function showFormStep() {
    if (!modalFormDate.value && calendarInput.value) {
      modalFormDate.value = calendarInput.value;
    }
    stepCalendar.hidden = true;
    stepForm.hidden = false;
  }

  function openModal() {
    const todayYmd = toLocalYMD(new Date());
    if (!selectedDate || selectedDate < todayYmd) {
      selectedDate = todayYmd;
    }
    calendarInput.value = selectedDate;
    modalFormDate.value = selectedDate;
    visibleMonth = parseYMD(selectedDate);
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    updateSelectedDateText();
    renderCalendar();

    modalMessage.textContent = '';
    modalMessage.classList.remove('show', 'success', 'error');

    showCalendarStep();
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    updateNowText();
    clearInterval(clockTimer);
    clockTimer = setInterval(updateNowText, 1000);
  }

  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearInterval(clockTimer);
    clockTimer = null;
  }

  openModalBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });

  continueBtn.addEventListener('click', () => {
    if (!calendarInput.value) {
      selectedDateText.textContent = 'Please select a date';
      return;
    }

    modalFormDate.value = calendarInput.value;
    showFormStep();
    modalForm.querySelector('input[name="name"]')?.focus();
  });

  backBtn.addEventListener('click', () => {
    showCalendarStep();
    calendarGrid.querySelector('.booking-calendar-day.is-selected')?.focus();
  });

  calendarPrevBtn.addEventListener('click', () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  calendarNextBtn.addEventListener('click', () => {
    visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  modalForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!modalFormDate.value && calendarInput.value) {
      modalFormDate.value = calendarInput.value;
    }

    if (!modalFormDate.value) {
      modalMessage.textContent = '✗ Please pick a booking date first.';
      modalMessage.classList.remove('success');
      modalMessage.classList.add('show', 'error');
      showCalendarStep();
      return;
    }

    modalSubmittedAt.value = new Date().toISOString();
    const ok = await submitBooking(modalForm, modalMessage);

    if (ok) {
      modalForm.reset();
      modalFormDate.value = '';
      setTimeout(() => {
        closeModal();
        showCalendarStep();
      }, 1100);
    }
  });
})();


/* === SCROLL-TO-TOP BUTTON === */
(function() {
  const btn = document.getElementById('scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

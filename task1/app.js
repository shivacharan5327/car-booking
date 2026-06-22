

(function () {
  'use strict';


  let allCars = [];
  let filteredCars = [];
  let activeCategory = 'all';
  let activeFuel = 'all';
  let activeSort = 'default';
  let searchQuery = '';

 
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const DOM = {
    navbar: $('#navbar'),
    navLinks: $('#navLinks'),
    navHamburger: $('#navHamburger'),
    searchInput: $('#searchInput'),
    categoryFilters: $('#categoryFilters'),
    fuelFilter: $('#fuelFilter'),
    priceSort: $('#priceSort'),
    resultCount: $('#resultCount'),
    carGrid: $('#carGrid'),
    bookingForm: $('#bookingForm'),
    bookingCar: $('#bookingCar'),
    bookingName: $('#bookingName'),
    bookingEmail: $('#bookingEmail'),
    bookingPhone: $('#bookingPhone'),
    bookingPickup: $('#bookingPickup'),
    bookingReturn: $('#bookingReturn'),
    scrollTop: $('#scrollTop'),
    toast: $('#toast'),
    toastIcon: $('#toastIcon'),
    toastMessage: $('#toastMessage'),
    toastClose: $('#toastClose'),
  };

 
  async function loadCars() {
    try {
      const response = await fetch('cars.json');
      allCars = await response.json();
      filteredCars = [...allCars];
      renderCars(filteredCars);
      populateBookingCarSelect();
    } catch (error) {
      console.error('Failed to load car data:', error);
      DOM.carGrid.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">⚠️</div>
          <h3>Unable to Load Cars</h3>
          <p>Please ensure you're running this from a local server (e.g., Live Server).</p>
        </div>
      `;
    }
  }


  function renderCars(cars) {
    DOM.resultCount.textContent = cars.length;

    if (cars.length === 0) {
      DOM.carGrid.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No Cars Found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      `;
      return;
    }

    DOM.carGrid.innerHTML = cars.map((car, index) => `
      <div class="car-card animate-on-scroll" style="transition-delay: ${index * 0.05}s" data-car-id="${car.id}">
        <div class="car-card-image">
          <img src="${car.image}" alt="${car.name} — ${car.category} car available for rent" loading="lazy" width="400" height="220">
          <div class="car-card-badges">
            <span class="badge ${car.available ? 'badge-available' : 'badge-unavailable'}">
              ${car.available ? 'Available' : 'Booked'}
            </span>
            <span class="badge badge-category">${car.category}</span>
          </div>
          <button class="car-card-favorite" aria-label="Add ${car.name} to favorites">♡</button>
        </div>
        <div class="car-card-body">
          <div class="car-card-header">
            <div>
              <h3 class="car-card-name">${car.name}</h3>
              <p class="car-card-brand">${car.brand} · ${car.year}</p>
            </div>
            <div class="car-card-rating">
              ★ <span>${car.rating}</span>
            </div>
          </div>
          <div class="car-card-specs">
            <div class="spec-item">
              <span class="spec-icon">⛽</span>
              <span class="spec-value">${car.fuelType}</span>
              <span class="spec-label">Fuel</span>
            </div>
            <div class="spec-item">
              <span class="spec-icon">👥</span>
              <span class="spec-value">${car.seats} Seats</span>
              <span class="spec-label">Capacity</span>
            </div>
            <div class="spec-item">
              <span class="spec-icon">⚙️</span>
              <span class="spec-value">${car.transmission}</span>
              <span class="spec-label">Transmission</span>
            </div>
          </div>
          <div class="car-card-footer">
            <div class="car-card-price">
              <span class="price-amount">₹${car.pricePerDay.toLocaleString('en-IN')}</span>
              <span class="price-period"> /day</span>
            </div>
            <button class="btn-book" ${!car.available ? 'disabled' : ''} onclick="DriveElite.bookCar(${car.id})">
              ${car.available ? 'Book Now' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>
    `).join('');

    
    observeAnimations();
  }


  function applyFilters() {
    filteredCars = allCars.filter((car) => {
      
      const matchesSearch =
        searchQuery === '' ||
        car.name.toLowerCase().includes(searchQuery) ||
        car.brand.toLowerCase().includes(searchQuery);

     
      const matchesCategory =
        activeCategory === 'all' ||
        car.category === activeCategory;

      
      const matchesFuel =
        activeFuel === 'all' ||
        car.fuelType === activeFuel;

      return matchesSearch && matchesCategory && matchesFuel;
    });

   
    switch (activeSort) {
      case 'low':
        filteredCars.sort((a, b) => a.pricePerDay - b.pricePerDay);
        break;
      case 'high':
        filteredCars.sort((a, b) => b.pricePerDay - a.pricePerDay);
        break;
      case 'rating':
        filteredCars.sort((a, b) => b.rating - a.rating);
        break;
      default:
       
        filteredCars.sort((a, b) => a.id - b.id);
    }

    renderCars(filteredCars);
  }

  
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }


  function populateBookingCarSelect() {
    const availableCars = allCars.filter((c) => c.available);
    DOM.bookingCar.innerHTML = '<option value="">— Choose a car —</option>' +
      availableCars.map((car) => `
        <option value="${car.id}">
          ${car.name} — ₹${car.pricePerDay.toLocaleString('en-IN')}/day
        </option>
      `).join('');
  }

  function validateForm() {
    let isValid = true;
    clearErrors();

    const name = DOM.bookingName.value.trim();
    const email = DOM.bookingEmail.value.trim();
    const phone = DOM.bookingPhone.value.trim();
    const car = DOM.bookingCar.value;
    const pickup = DOM.bookingPickup.value;
    const returnDate = DOM.bookingReturn.value;

 
    if (!name) {
      showError('bookingName', 'nameError', 'Full name is required');
      isValid = false;
    } else if (name.length < 2) {
      showError('bookingName', 'nameError', 'Name must be at least 2 characters');
      isValid = false;
    }

  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showError('bookingEmail', 'emailError', 'Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showError('bookingEmail', 'emailError', 'Please enter a valid email address');
      isValid = false;
    }

   
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phone) {
      showError('bookingPhone', 'phoneError', 'Phone number is required');
      isValid = false;
    } else if (!phoneRegex.test(phone)) {
      showError('bookingPhone', 'phoneError', 'Enter a valid 10-digit Indian mobile number');
      isValid = false;
    }

   
    if (!car) {
      showError('bookingCar', 'carError', 'Please select a car');
      isValid = false;
    }

   
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!pickup) {
      showError('bookingPickup', 'pickupError', 'Pickup date is required');
      isValid = false;
    } else if (new Date(pickup) < today) {
      showError('bookingPickup', 'pickupError', 'Pickup date cannot be in the past');
      isValid = false;
    }

    if (!returnDate) {
      showError('bookingReturn', 'returnError', 'Return date is required');
      isValid = false;
    } else if (pickup && new Date(returnDate) <= new Date(pickup)) {
      showError('bookingReturn', 'returnError', 'Return date must be after pickup date');
      isValid = false;
    }

    return isValid;
  }

  function showError(inputId, errorId, message) {
    const input = $(`#${inputId}`);
    const error = $(`#${errorId}`);
    if (input) input.classList.add('error');
    if (error) error.textContent = message;
  }

  function clearErrors() {
    $$('.form-input, .form-select').forEach((el) => el.classList.remove('error'));
    $$('.form-error').forEach((el) => (el.textContent = ''));
  }

  function handleBookingSubmit(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const selectedCar = allCars.find((c) => c.id === parseInt(DOM.bookingCar.value));

    const booking = {
      id: Date.now(),
      name: DOM.bookingName.value.trim(),
      email: DOM.bookingEmail.value.trim(),
      phone: DOM.bookingPhone.value.trim(),
      carId: selectedCar.id,
      carName: selectedCar.name,
      pricePerDay: selectedCar.pricePerDay,
      pickupDate: DOM.bookingPickup.value,
      returnDate: DOM.bookingReturn.value,
      createdAt: new Date().toISOString(),
    };

   
    const days = Math.ceil(
      (new Date(booking.returnDate) - new Date(booking.pickupDate)) / (1000 * 60 * 60 * 24)
    );
    booking.totalDays = days;
    booking.totalPrice = days * booking.pricePerDay;

    
    saveBooking(booking);

   
    showToast(
      `Booking confirmed! ${booking.carName} for ${days} day${days > 1 ? 's' : ''} — Total: ₹${booking.totalPrice.toLocaleString('en-IN')}`,
      'success'
    );

   
    DOM.bookingForm.reset();
    clearErrors();
  }

  function saveBooking(booking) {
    try {
      const bookings = JSON.parse(localStorage.getItem('driveelite_bookings') || '[]');
      bookings.push(booking);
      localStorage.setItem('driveelite_bookings', JSON.stringify(bookings));
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
  }

  
  function bookCar(carId) {
    const car = allCars.find((c) => c.id === carId);
    if (!car || !car.available) return;

   
    const bookingSection = $('#booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    }

    
    setTimeout(() => {
      DOM.bookingCar.value = carId;
    }, 500);
  }


  let toastTimeout;

  function showToast(message, type = 'success') {
    DOM.toastIcon.textContent = type === 'success' ? '✅' : '⚠️';
    DOM.toastMessage.textContent = message;
    DOM.toast.className = `toast show ${type}`;

    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 6000);
  }


  function handleScroll() {
    const scrollY = window.scrollY;

   
    DOM.navbar.classList.toggle('scrolled', scrollY > 50);

 
    DOM.scrollTop.classList.toggle('visible', scrollY > 600);

   
    const sections = $$('section[id]');
    let currentSection = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 100;
      if (scrollY >= sectionTop) {
        currentSection = section.getAttribute('id');
      }
    });

    $$('.nav-links a').forEach((link) => {
      link.classList.remove('active');
      const href = link.getAttribute('href');
      if (href && href.includes(currentSection)) {
        link.classList.add('active');
      }
    });
  }

  function toggleMobileNav() {
    DOM.navLinks.classList.toggle('open');
    DOM.navHamburger.classList.toggle('active');
    document.body.style.overflow = DOM.navLinks.classList.contains('open') ? 'hidden' : '';
  }

 
  let observer;

  function observeAnimations() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    $$('.animate-on-scroll:not(.visible)').forEach((el) => observer.observe(el));
  }


  function animateCounters() {
    const counters = $$('.stat-number[data-target]');

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            animateValue(el, 0, target, 2000);
            counterObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));
  }

  function animateValue(el, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * eased);

      el.textContent = current.toLocaleString('en-IN') + (end >= 50 && end < 100 ? '' : end >= 1000 ? '+' : '+');

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }


  function setupDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    DOM.bookingPickup.setAttribute('min', today);

    DOM.bookingPickup.addEventListener('change', () => {
      const pickupDate = DOM.bookingPickup.value;
      if (pickupDate) {
        const nextDay = new Date(pickupDate);
        nextDay.setDate(nextDay.getDate() + 1);
        DOM.bookingReturn.setAttribute('min', nextDay.toISOString().split('T')[0]);

       
        if (DOM.bookingReturn.value && DOM.bookingReturn.value <= pickupDate) {
          DOM.bookingReturn.value = '';
        }
      }
    });
  }


  function bindEvents() {
  
    window.addEventListener('scroll', handleScroll, { passive: true });

    
    DOM.navHamburger.addEventListener('click', toggleMobileNav);

   
    $$('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        if (DOM.navLinks.classList.contains('open')) {
          toggleMobileNav();
        }
      });
    });

   
    DOM.searchInput.addEventListener(
      'input',
      debounce(() => {
        searchQuery = DOM.searchInput.value.toLowerCase().trim();
        applyFilters();
      }, 300)
    );

   
    DOM.categoryFilters.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (!pill) return;

      $$('.filter-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.dataset.category;
      applyFilters();
    });

    DOM.fuelFilter.addEventListener('change', () => {
      activeFuel = DOM.fuelFilter.value;
      applyFilters();
    });

    
    DOM.priceSort.addEventListener('change', () => {
      activeSort = DOM.priceSort.value;
      applyFilters();
    });

    
    DOM.bookingForm.addEventListener('submit', handleBookingSubmit);

    $$('.form-input, .form-select').forEach((input) => {
      input.addEventListener('input', () => {
        input.classList.remove('error');
        const errorEl = input.parentElement.querySelector('.form-error');
        if (errorEl) errorEl.textContent = '';
      });
    });

    
    DOM.scrollTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

   
    DOM.toastClose.addEventListener('click', () => {
      DOM.toast.classList.remove('show');
    });
  }


  function init() {
    loadCars();
    bindEvents();
    setupDateInputs();
    observeAnimations();
    animateCounters();
    handleScroll(); 
  }


  window.DriveElite = { bookCar };


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

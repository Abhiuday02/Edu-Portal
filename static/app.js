// Page navigation progress bar
function initPageProgress() {
    const progressBar = document.getElementById('page-progress');
    if (!progressBar) return;

    let rafId = null;
    let progress = 0;
    let isRunning = false;
    let lastTick = 0;

    function startProgress() {
        if (isRunning) return;
        isRunning = true;
        progress = 0;
        lastTick = performance.now();
        progressBar.style.transform = 'scaleX(0)';
        progressBar.classList.add('loading');
        document.body.classList.add('navigating');

        const tick = (now) => {
            if (!isRunning) return;
            const dt = Math.max(0, now - lastTick);
            lastTick = now;

            // Smoothly approach 0.9 without jumping.
            // The closer we get, the smaller the increments become.
            const remaining = 0.9 - progress;
            if (remaining > 0) {
                const step = Math.min(remaining, (dt / 1000) * 0.65 * (0.25 + remaining));
                progress += step;
            }

            progressBar.style.transform = `scaleX(${Math.max(0, Math.min(0.9, progress))})`;
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
    }

    function completeProgress() {
        if (!isRunning) return;
        isRunning = false;
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        progressBar.style.transform = 'scaleX(1)';
        setTimeout(() => {
            progressBar.classList.remove('loading');
            progressBar.style.transform = 'scaleX(0)';
            document.body.classList.remove('navigating');
        }, 300);
    }

    // Intercept navigation clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        // Skip external links, anchors, and special links
        if (
            href.startsWith('http') ||
            href.startsWith('#') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:') ||
            link.hasAttribute('target') ||
            link.hasAttribute('download') ||
            e.ctrlKey || e.metaKey || e.shiftKey
        ) {
            return;
        }

        // Check if it's a same-origin navigation
        const url = new URL(href, window.location.origin);
        if (url.origin === window.location.origin && url.pathname !== window.location.pathname) {
            e.preventDefault();
            startProgress();
            link.setAttribute('aria-disabled', 'true');
            link.style.pointerEvents = 'none';
            window.location.href = href;
        }
    });

    // Complete progress when page is loaded/hidden
    window.addEventListener('pagehide', completeProgress);
    window.addEventListener('beforeunload', completeProgress);
}

function initTapFeedback() {
    const selector = 'button, a.minimal-nav-item, a.admin-btn, .minimal-btn, .admin-btn, [data-mobile-nav-toggle]';

    function targetFromEvent(e) {
        const t = e.target;
        if (!(t instanceof Element)) return null;
        return t.closest(selector);
    }

    function press(el) {
        if (!(el instanceof HTMLElement)) return;
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') return;
        el.classList.add('ui-pressed');
    }

    function release(el) {
        if (!(el instanceof HTMLElement)) return;
        el.classList.remove('ui-pressed');
    }

    document.addEventListener(
        'pointerdown',
        (e) => {
            const el = targetFromEvent(e);
            if (el) press(el);
        },
        { passive: true }
    );

    document.addEventListener(
        'pointerup',
        (e) => {
            const el = targetFromEvent(e);
            if (el) release(el);
        },
        { passive: true }
    );

    document.addEventListener(
        'pointercancel',
        (e) => {
            const el = targetFromEvent(e);
            if (el) release(el);
        },
        { passive: true }
    );

    document.addEventListener(
        'blur',
        () => {
            document.querySelectorAll('.ui-pressed').forEach((el) => el.classList.remove('ui-pressed'));
        },
        true
    );
}

function initNewsFiltersBottomSheet() {
    const btn = document.getElementById('newsFiltersBtn');
    const bottomSheet = document.getElementById('newsFiltersBottomSheet');
    const backdrop = document.getElementById('newsFiltersSheetBackdrop');
    const sheet = document.getElementById('newsFiltersSheet');
    const closeBtn = document.getElementById('newsFiltersSheetClose');
    const handle = document.getElementById('newsFiltersSheetHandle');
    const qHidden = document.getElementById('newsFiltersQ');
    const qInput = document.getElementById('newsSearch');

    if (!bottomSheet || !backdrop || !sheet || !closeBtn || !handle) {
        return;
    }

    const desktopDetails = document.getElementById('newsDesktopFilters');

    function setDisabled(root, disabled) {
        if (!root) return;
        root.querySelectorAll('input, select, textarea, button').forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            if (el.id === 'newsFiltersBtn') return;
            if (el.getAttribute('type') === 'submit') return;
            el.toggleAttribute('disabled', !!disabled);
        });
    }

    const mq = window.matchMedia('(min-width: 768px)');
    function syncMode() {
        const isDesktop = mq.matches;
        setDisabled(desktopDetails, !isDesktop);
        setDisabled(sheet, isDesktop);
        if (btn) {
            btn.classList.toggle('hidden', isDesktop);
        }
        if (isDesktop) {
            closeSheet(false);
        }
    }

    let scrollLockY = 0;
    let isOpen = false;
    function lockScroll() {
        scrollLockY = window.scrollY || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        const y = top ? Math.abs(parseInt(top, 10)) : scrollLockY;
        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    function openSheet() {
        if (mq.matches) return;
        if (qHidden && qInput) {
            qHidden.value = qInput.value || '';
        }
        lockScroll();
        isOpen = true;
        bottomSheet.classList.remove('opacity-0', 'pointer-events-none');
        bottomSheet.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
        backdrop.classList.remove('pointer-events-none');
        backdrop.classList.add('pointer-events-auto');
    }

    function closeSheet(unlock = true) {
        bottomSheet.classList.add('opacity-0', 'pointer-events-none');
        bottomSheet.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full');
        backdrop.classList.add('pointer-events-none');
        backdrop.classList.remove('pointer-events-auto');
        if (unlock && isOpen) {
            unlockScroll();
        }
        isOpen = false;
    }

    if (btn) {
        btn.addEventListener('click', openSheet);
    }
    closeBtn.addEventListener('click', () => closeSheet(true));
    backdrop.addEventListener('click', () => closeSheet(true));

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSheet(true);
        }
    });

    let startY = 0;
    let isDragging = false;
    let dragStartTime = 0;

    function onStart(e) {
        if (mq.matches) return;
        const t = e.touches ? e.touches[0] : e;
        startY = t.clientY;
        isDragging = true;
        dragStartTime = Date.now();
        sheet.style.transition = 'none';
    }

    function onMove(e) {
        if (!isDragging) return;
        const t = e.touches ? e.touches[0] : e;
        const dy = t.clientY - startY;
        if (dy > 0) {
            sheet.style.transform = `translateY(${dy}px)`;
        }
    }

    function onEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = '';

        const endY = (e.changedTouches ? e.changedTouches[0] : e).clientY;
        const dy = endY - startY;
        const dt = Date.now() - dragStartTime;

        if (dy > 120 || (dy > 60 && dt < 250)) {
            sheet.style.transform = '';
            closeSheet(true);
            return;
        }

        sheet.style.transform = '';
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    try {
        mq.addEventListener('change', syncMode);
    } catch {
        mq.addListener(syncMode);
    }
    syncMode();
}

function initChangePasswordBottomSheet() {
    const actionBtn = document.getElementById('changePasswordBtn');
    const bottomSheet = document.getElementById('changePasswordBottomSheet');
    const backdrop = document.getElementById('changePasswordSheetBackdrop');
    const sheet = document.getElementById('changePasswordSheet');
    const closeBtn = document.getElementById('changePasswordSheetClose');
    const handle = document.getElementById('changePasswordSheetHandle');

    if (!bottomSheet || !backdrop || !sheet || !closeBtn || !handle) {
        return;
    }

    if (bottomSheet.parentElement !== document.body) {
        document.body.appendChild(bottomSheet);
    }

    let scrollLockY = 0;
    let isOpen = false;

    function lockScroll() {
        scrollLockY = window.scrollY || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        const y = top ? Math.abs(parseInt(top, 10)) : scrollLockY;
        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    function openSheet() {
        lockScroll();
        isOpen = true;
        bottomSheet.classList.remove('opacity-0', 'pointer-events-none');
        bottomSheet.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
        backdrop.classList.remove('pointer-events-none');
        backdrop.classList.add('pointer-events-auto');
    }

    function closeSheet() {
        bottomSheet.classList.add('opacity-0', 'pointer-events-none');
        bottomSheet.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full');
        backdrop.classList.add('pointer-events-none');
        backdrop.classList.remove('pointer-events-auto');
        if (isOpen) {
            unlockScroll();
        }
        isOpen = false;
    }

    if (actionBtn) {
        actionBtn.addEventListener('click', openSheet);
    }
    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSheet();
        }
    });

    // Swipe down to close
    let startY = 0;
    let isDragging = false;
    let dragStartTime = 0;

    function onStart(e) {
        const t = e.touches ? e.touches[0] : e;
        startY = t.clientY;
        isDragging = true;
        dragStartTime = Date.now();
        sheet.style.transition = 'none';
    }

    function onMove(e) {
        if (!isDragging) return;
        const t = e.touches ? e.touches[0] : e;
        const dy = t.clientY - startY;
        if (dy > 0) {
            sheet.style.transform = `translateY(${dy}px)`;
        }
    }

    function onEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = '';

        const endY = (e.changedTouches ? e.changedTouches[0] : e).clientY;
        const dy = endY - startY;
        const dt = Date.now() - dragStartTime;

        if (dy > 120 || (dy > 60 && dt < 250)) {
            sheet.style.transform = '';
            closeSheet();
            return;
        }

        sheet.style.transform = '';
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Auto-open when server sent message
    const autoOpen = bottomSheet.getAttribute('data-auto-open') === '1';
    if (autoOpen) {
        setTimeout(openSheet, 50);
    }
}

function initLibraryFiltersBottomSheet() {
    const btn = document.getElementById('libraryFiltersBtn');
    const bottomSheet = document.getElementById('libraryFiltersBottomSheet');
    const backdrop = document.getElementById('libraryFiltersSheetBackdrop');
    const sheet = document.getElementById('libraryFiltersSheet');
    const closeBtn = document.getElementById('libraryFiltersSheetClose');
    const handle = document.getElementById('libraryFiltersSheetHandle');
    const qHidden = document.getElementById('libraryFiltersQ');
    const qInput = document.getElementById('librarySearch');

    if (!bottomSheet || !backdrop || !sheet || !closeBtn || !handle) {
        return;
    }

    const desktopDetails = document.getElementById('libraryDesktopFilters');

    function setDisabled(root, disabled) {
        if (!root) return;
        root.querySelectorAll('input, select, textarea, button').forEach((el) => {
            if (!(el instanceof HTMLElement)) return;
            if (el.id === 'libraryFiltersBtn') return;
            if (el.getAttribute('type') === 'submit') return;
            el.toggleAttribute('disabled', !!disabled);
        });
    }

    const mq = window.matchMedia('(min-width: 768px)');
    function syncMode() {
        const isDesktop = mq.matches;

        // On desktop: keep dropdown filters active, disable bottom-sheet inputs.
        // On mobile: disable dropdown filters inputs (even though hidden) to avoid duplicate query params.
        setDisabled(desktopDetails, !isDesktop);
        setDisabled(sheet, isDesktop);
        if (btn) {
            btn.classList.toggle('hidden', isDesktop);
        }
        if (isDesktop) {
            closeSheet(false);
        }
    }

    let scrollLockY = 0;
    let isOpen = false;
    function lockScroll() {
        scrollLockY = window.scrollY || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        const y = top ? Math.abs(parseInt(top, 10)) : scrollLockY;
        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    function openSheet() {
        if (mq.matches) return; // desktop
        if (qHidden && qInput) {
            qHidden.value = qInput.value || '';
        }
        lockScroll();
        isOpen = true;
        bottomSheet.classList.remove('opacity-0', 'pointer-events-none');
        bottomSheet.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
        backdrop.classList.remove('pointer-events-none');
        backdrop.classList.add('pointer-events-auto');
    }

    function closeSheet(unlock = true) {
        bottomSheet.classList.add('opacity-0', 'pointer-events-none');
        bottomSheet.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full');
        backdrop.classList.add('pointer-events-none');
        backdrop.classList.remove('pointer-events-auto');
        if (unlock && isOpen) {
            unlockScroll();
        }
        isOpen = false;
    }

    if (btn) {
        btn.addEventListener('click', openSheet);
    }
    closeBtn.addEventListener('click', () => closeSheet(true));
    backdrop.addEventListener('click', () => closeSheet(true));

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSheet(true);
        }
    });

    // Swipe down to close
    let startY = 0;
    let isDragging = false;
    let dragStartTime = 0;

    function onStart(e) {
        if (mq.matches) return;
        const t = e.touches ? e.touches[0] : e;
        startY = t.clientY;
        isDragging = true;
        dragStartTime = Date.now();
        sheet.style.transition = 'none';
    }

    function onMove(e) {
        if (!isDragging) return;
        const t = e.touches ? e.touches[0] : e;
        const dy = t.clientY - startY;
        if (dy > 0) {
            sheet.style.transform = `translateY(${dy}px)`;
        }
    }

    function onEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = '';

        const endY = (e.changedTouches ? e.changedTouches[0] : e).clientY;
        const dy = endY - startY;
        const dt = Date.now() - dragStartTime;

        if (dy > 120 || (dy > 60 && dt < 250)) {
            sheet.style.transform = '';
            closeSheet(true);
            return;
        }

        sheet.style.transform = '';
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    try {
        mq.addEventListener('change', syncMode);
    } catch {
        mq.addListener(syncMode);
    }
    syncMode();
}

function initAdminChangePasswordBottomSheet() {
    const actionBtn = document.getElementById('adminChangePasswordBtn');
    const actionBtnMobile = document.getElementById('adminChangePasswordBtnMobile');
    const actionBtnSidebar = document.getElementById('adminChangePasswordBtnSidebar');
    const bottomSheet = document.getElementById('adminChangePasswordBottomSheet');
    const backdrop = document.getElementById('adminChangePasswordSheetBackdrop');
    const sheet = document.getElementById('adminChangePasswordSheet');
    const closeBtn = document.getElementById('adminChangePasswordSheetClose');
    const handle = document.getElementById('adminChangePasswordSheetHandle');

    if (!bottomSheet || !backdrop || !sheet || !closeBtn || !handle) {
        return;
    }

    let scrollLockY = 0;

    function lockScroll() {
        scrollLockY = window.scrollY || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        const y = top ? Math.abs(parseInt(top, 10)) : scrollLockY;
        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    function openSheet() {
        lockScroll();
        bottomSheet.classList.remove('opacity-0', 'pointer-events-none');
        bottomSheet.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
        backdrop.classList.remove('pointer-events-none');
        backdrop.classList.add('pointer-events-auto');
    }

    function closeSheet() {
        bottomSheet.classList.add('opacity-0', 'pointer-events-none');
        bottomSheet.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full');
        backdrop.classList.add('pointer-events-none');
        backdrop.classList.remove('pointer-events-auto');
        unlockScroll();
    }

    [actionBtn, actionBtnMobile, actionBtnSidebar].forEach((btn) => {
        if (!btn) return;
        btn.addEventListener('click', openSheet);
    });
    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSheet();
        }
    });

    // Swipe down to close
    let startY = 0;
    let isDragging = false;
    let dragStartTime = 0;

    function onStart(e) {
        const t = e.touches ? e.touches[0] : e;
        startY = t.clientY;
        isDragging = true;
        dragStartTime = Date.now();
        sheet.style.transition = 'none';
    }

    function onMove(e) {
        if (!isDragging) return;
        const t = e.touches ? e.touches[0] : e;
        const dy = t.clientY - startY;
        if (dy > 0) {
            sheet.style.transform = `translateY(${dy}px)`;
        }
    }

    function onEnd(e) {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = '';

        const endY = (e.changedTouches ? e.changedTouches[0] : e).clientY;
        const dy = endY - startY;
        const dt = Date.now() - dragStartTime;

        if (dy > 120 || (dy > 60 && dt < 250)) {
            sheet.style.transform = '';
            closeSheet();
            return;
        }

        sheet.style.transform = '';
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: true });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // Auto-open when server sent message
    const autoOpen = bottomSheet.getAttribute('data-auto-open') === '1';
    if (autoOpen) {
        setTimeout(openSheet, 50);
    }
}

function generateAttendance() {
    const grid = document.getElementById('attendanceGrid');
    if (!grid) {
        return;
    }
    const days = 7;
    const weeks = 28;

    let levels = [];
    const levelsScript = document.getElementById('attendanceLevels');
    if (levelsScript && levelsScript.textContent) {
        try {
            const parsed = JSON.parse(levelsScript.textContent);
            if (Array.isArray(parsed)) {
                levels = parsed;
            }
        } catch {
            levels = [];
        }
    }

    for (let i = 0; i < days * weeks; i++) {
        const cell = document.createElement('div');
        cell.className = 'attendance-cell';

        const raw = levels[i];
        const level = Number.isFinite(Number(raw)) ? Math.max(0, Math.min(4, Number(raw))) : 0;
        cell.classList.add(`level-${level}`);

        const dayStr = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i % 7];
        cell.title = `${dayStr} Attendance Level: ${level}/4`;

        grid.appendChild(cell);
    }
}

function applyAttendanceRings() {
    document.querySelectorAll('.attendance-ring[data-percentage]').forEach((el) => {
        const value = Number(el.dataset.percentage);
        const pct = Number.isFinite(value) ? value : 0;
        el.style.setProperty('--percentage', String(pct));
    });
}

function initUxReveal() {
    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = Array.from(document.querySelectorAll('.minimal-card, .admin-card, .faculty-card'));
    if (!nodes.length) {
        return;
    }

    if (reduceMotion || !('IntersectionObserver' in window)) {
        nodes.forEach((el) => {
            el.classList.remove('ux-reveal');
        });
        return;
    }

    nodes.forEach((el) => {
        el.classList.add('ux-reveal');
    });

    const io = new IntersectionObserver(
        (entries) => {
            entries.forEach((e) => {
                if (!e.isIntersecting) return;
                const el = e.target;
                el.classList.add('is-in');
                io.unobserve(el);
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    );

    nodes.forEach((el) => io.observe(el));
}

function initWeeklyTimetable() {
    const root = document.querySelector('[data-weekly-timetable]');
    if (!root) {
        return;
    }

    const panels = root.querySelector('[data-week-panels]');
    if (!panels) {
        return;
    }

    const tabs = Array.from(root.querySelectorAll('[data-week-tab]'));

    function setActiveTab(index) {
        tabs.forEach((btn) => {
            const isActive = Number(btn.dataset.weekTab) === index;
            btn.classList.toggle('bg-indigo-50', isActive);
            btn.classList.toggle('text-indigo-600', isActive);
            btn.classList.toggle('bg-slate-100', !isActive);
            btn.classList.toggle('text-slate-700', !isActive);
        });
    }

    function scrollToIndex(index) {
        const width = panels.clientWidth || 1;
        panels.scrollTo({ left: index * width, behavior: 'smooth' });
    }

    function clampDayIndex(i) {
        const n = Number(i);
        if (!Number.isFinite(n)) {
            return 0;
        }
        return Math.max(0, Math.min(6, n));
    }

    function setActiveDay(index) {
        const next = clampDayIndex(index);
        root.dataset.activeDay = String(next);
        setActiveTab(next);
        scrollToIndex(next);
    }

    tabs.forEach((btn) => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.weekTab);
            if (Number.isFinite(index)) {
                setActiveDay(index);
            }
        });
    });

    let raf = 0;
    panels.addEventListener('scroll', () => {
        if (raf) {
            return;
        }
        raf = window.requestAnimationFrame(() => {
            raf = 0;
            const width = panels.clientWidth || 1;
            const index = Math.round(panels.scrollLeft / width);
            root.dataset.activeDay = String(clampDayIndex(index));
            setActiveTab(Number(root.dataset.activeDay));
        });
    }, { passive: true });

    // Controlled horizontal swipe: move only 1 day per swipe.
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeDragging = false;
    let swipeConsumed = false;
    let swipeLock = false;

    function lockSwipeTemporarily() {
        swipeLock = true;
        window.setTimeout(() => {
            swipeLock = false;
        }, 350);
    }

    panels.addEventListener('touchstart', (e) => {
        if (!e.touches || !e.touches[0]) {
            return;
        }
        swipeStartX = e.touches[0].clientX;
        swipeStartY = e.touches[0].clientY;
        swipeDragging = true;
        swipeConsumed = false;
    }, { passive: true });

    panels.addEventListener('touchmove', (e) => {
        if (!swipeDragging || swipeConsumed || swipeLock || !e.touches || !e.touches[0]) {
            return;
        }
        const dx = e.touches[0].clientX - swipeStartX;
        const dy = e.touches[0].clientY - swipeStartY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24 && e.cancelable) {
            // Prevent vertical scroll once we detect a horizontal gesture.
            e.preventDefault();
        }
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
            const current = clampDayIndex(root.dataset.activeDay || root.dataset.initialDay || 0);
            const next = dx < 0 ? current + 1 : current - 1;
            swipeConsumed = true;
            lockSwipeTemporarily();
            setActiveDay(next);
        }
    }, { passive: false });

    panels.addEventListener('touchend', () => {
        swipeDragging = false;
    }, { passive: true });

    window.addEventListener('resize', () => {
        const current = Number(root.dataset.activeDay || root.dataset.initialDay || 0);
        if (Number.isFinite(current)) {
            panels.scrollLeft = (panels.clientWidth || 1) * current;
        }
    });

    const initial = Number(root.dataset.initialDay || 0);
    setActiveDay(Number.isFinite(initial) ? initial : 0);
}

function initScheduleCalendarSheet() {
    const calendarRoot = document.querySelector('[data-schedule-calendar]');
    if (!calendarRoot) {
        return;
    }

    // Smooth month swipe navigation (left/right) without full page reload.
    (function initMonthCarousel() {
        const apiUrl = (calendarRoot.dataset.apiMonthUrl || '').trim();
        if (!apiUrl) {
            return;
        }

        const initialYear = Number(calendarRoot.dataset.viewYear || 0);
        const initialMonth = Number(calendarRoot.dataset.viewMonth || 0);
        if (!Number.isFinite(initialYear) || !Number.isFinite(initialMonth) || initialYear <= 0 || initialMonth <= 0) {
            return;
        }

        const monthLabelEl = calendarRoot.querySelector('[data-cal-month-label]');
        const gridEl = calendarRoot.querySelector('[data-cal-grid]');
        if (!monthLabelEl || !gridEl) {
            return;
        }

        const todayDate = String(calendarRoot.dataset.todayDate || '').trim();

        function keyFor(y, m) {
            return `${y}-${String(m).padStart(2, '0')}`;
        }

        function addMonths(y, m, delta) {
            const dt = new Date(y, m - 1, 1);
            dt.setMonth(dt.getMonth() + delta);
            return { y: dt.getFullYear(), m: dt.getMonth() + 1 };
        }

        const cache = new Map();
        let current = { y: initialYear, m: initialMonth };
        let transitioning = false;

        async function fetchMonth(y, m) {
            const k = keyFor(y, m);
            if (cache.has(k)) {
                return cache.get(k);
            }
            const url = new URL(apiUrl, window.location.origin);
            url.searchParams.set('year', String(y));
            url.searchParams.set('month', String(m));
            const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            if (!data || !data.ok) {
                throw new Error('Month fetch failed');
            }
            cache.set(k, data);
            // Keep cache from growing without bounds.
            if (cache.size > 9) {
                const firstKey = cache.keys().next().value;
                cache.delete(firstKey);
            }
            return data;
        }

        function esc(s) {
            return String(s)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');
        }

        function renderGrid(data) {
            const weeks = Array.isArray(data.calendar_weeks) ? data.calendar_weeks : [];
            const itemsByDate = data.month_items_by_date || {};
            const eventsByDate = data.schedule_by_date || {};

            let html = '';
            for (const week of weeks) {
                for (const cell of week) {
                    const dateKey = String(cell.date || '');
                    const day = Number(cell.day || 0);
                    const inMonth = Boolean(cell.in_month);
                    const items = itemsByDate[dateKey] || [];
                    const events = eventsByDate[dateKey] || [];
                    const hasAny = (Array.isArray(items) && items.length) || (Array.isArray(events) && events.length);
                    const isToday = todayDate && dateKey === todayDate;

                    const cls = [
                        'aspect-square',
                        'rounded-xl',
                        'border',
                        'border-slate-200',
                        'bg-white',
                        'hover:bg-slate-50',
                        'transition-all',
                        'flex',
                        'flex-col',
                        'items-center',
                        'justify-center',
                        'relative',
                    ];
                    if (isToday) {
                        cls.push('border-indigo-300', 'bg-indigo-50', 'shadow-sm');
                    }
                    if (!inMonth) {
                        cls.push('opacity-40');
                    }

                    const dayCls = ['text-sm', 'font-semibold', 'text-slate-900'];
                    if (isToday) {
                        dayCls.push('text-indigo-700');
                    }

                    html += `<button type="button" class="${cls.join(' ')}" data-cal-date="${esc(dateKey)}" data-in-month="${inMonth ? 1 : 0}" data-items="${esc(JSON.stringify(items))}" data-events="${esc(JSON.stringify(events))}">`;
                    html += `<span class="${dayCls.join(' ')}">${esc(day)}</span>`;
                    if (hasAny) {
                        html += '<span class="absolute bottom-2 w-2 h-2 rounded-full bg-indigo-500"></span>';
                    }
                    html += '</button>';
                }
            }
            return html;
        }

        async function preloadAdjacent() {
            const prev = addMonths(current.y, current.m, -1);
            const next = addMonths(current.y, current.m, 1);
            try {
                await Promise.allSettled([
                    fetchMonth(prev.y, prev.m),
                    fetchMonth(current.y, current.m),
                    fetchMonth(next.y, next.m),
                ]);
            } catch {
                // ignore
            }
        }

        async function swapMonth(delta) {
            if (transitioning) {
                return;
            }
            transitioning = true;

            const from = { ...current };
            const to = addMonths(current.y, current.m, delta);
            const fromHtml = gridEl.innerHTML;

            let toData;
            try {
                toData = await fetchMonth(to.y, to.m);
            } catch {
                transitioning = false;
                return;
            }

            const fromData = cache.get(keyFor(from.y, from.m));
            if (!fromData) {
                // Current month data might not be cached yet (initial load). Use existing DOM as the
                // "from" state so we can still animate smoothly.
                const track = document.createElement('div');
                track.style.display = 'flex';
                track.style.width = '300%';
                track.style.transform = 'translateX(-33.3333%)';
                track.style.transition = 'transform 180ms ease-out';

                const left = document.createElement('div');
                left.style.width = '33.3333%';
                left.style.flex = '0 0 33.3333%';

                const mid = document.createElement('div');
                mid.style.width = '33.3333%';
                mid.style.flex = '0 0 33.3333%';

                const right = document.createElement('div');
                right.style.width = '33.3333%';
                right.style.flex = '0 0 33.3333%';

                if (delta > 0) {
                    left.innerHTML = fromHtml;
                    mid.innerHTML = renderGrid(toData);
                    right.innerHTML = '';
                } else {
                    left.innerHTML = '';
                    mid.innerHTML = renderGrid(toData);
                    right.innerHTML = fromHtml;
                }

                track.appendChild(left);
                track.appendChild(mid);
                track.appendChild(right);

                gridEl.innerHTML = '';
                gridEl.style.overflow = 'hidden';
                gridEl.appendChild(track);

                window.requestAnimationFrame(() => {
                    track.style.transform = delta > 0 ? 'translateX(-66.6666%)' : 'translateX(0%)';
                });

                window.setTimeout(() => {
                    current = to;
                    monthLabelEl.textContent = toData.month_label || monthLabelEl.textContent;
                    gridEl.style.overflow = '';
                    gridEl.innerHTML = renderGrid(toData);
                    calendarRoot.dataset.viewYear = String(toData.view_year);
                    calendarRoot.dataset.viewMonth = String(toData.view_month);
                    transitioning = false;
                    preloadAdjacent();
                }, 220);
                return;
            }

            // Build a 3-panel track: prev/current/next
            const track = document.createElement('div');
            track.style.display = 'flex';
            track.style.width = '300%';
            track.style.transform = 'translateX(-33.3333%)';
            track.style.transition = 'transform 180ms ease-out';

            const left = document.createElement('div');
            left.style.width = '33.3333%';
            left.style.flex = '0 0 33.3333%';

            const mid = document.createElement('div');
            mid.style.width = '33.3333%';
            mid.style.flex = '0 0 33.3333%';

            const right = document.createElement('div');
            right.style.width = '33.3333%';
            right.style.flex = '0 0 33.3333%';

            if (delta > 0) {
                left.innerHTML = renderGrid(fromData);
                mid.innerHTML = renderGrid(toData);
                right.innerHTML = '';
            } else {
                left.innerHTML = '';
                mid.innerHTML = renderGrid(toData);
                right.innerHTML = renderGrid(fromData);
            }

            track.appendChild(left);
            track.appendChild(mid);
            track.appendChild(right);

            // Replace grid with track temporarily
            gridEl.innerHTML = '';
            gridEl.style.overflow = 'hidden';
            gridEl.appendChild(track);

            // Animate
            window.requestAnimationFrame(() => {
                track.style.transform = delta > 0 ? 'translateX(-66.6666%)' : 'translateX(0%)';
            });

            window.setTimeout(() => {
                // Commit new month
                current = to;
                monthLabelEl.textContent = toData.month_label || monthLabelEl.textContent;
                gridEl.style.overflow = '';
                gridEl.innerHTML = renderGrid(toData);
                calendarRoot.dataset.viewYear = String(toData.view_year);
                calendarRoot.dataset.viewMonth = String(toData.view_month);
                transitioning = false;
                preloadAdjacent();
            }, 220);
        }

        // Kick off background preload and fetch current month from API
        fetchMonth(initialYear, initialMonth)
            .then((data) => {
                monthLabelEl.textContent = data.month_label || monthLabelEl.textContent;
                gridEl.innerHTML = renderGrid(data);
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                preloadAdjacent();
            });

        let startX = 0;
        let startY = 0;
        let dragging = false;
        let consumed = false;

        calendarRoot.addEventListener('touchstart', (e) => {
            if (!e.touches || !e.touches[0]) {
                return;
            }
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            dragging = true;
            consumed = false;
        }, { passive: true });

        calendarRoot.addEventListener('touchmove', (e) => {
            if (!dragging || consumed || transitioning || !e.touches || !e.touches[0]) {
                return;
            }
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 24 && e.cancelable) {
                e.preventDefault();
            }
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
                consumed = true;
                // Swipe left -> next month, swipe right -> previous month
                swapMonth(dx < 0 ? 1 : -1);
            }
        }, { passive: false });

        calendarRoot.addEventListener('touchend', () => {
            dragging = false;
        }, { passive: true });
    })();

    const backdrop = document.querySelector('[data-bottom-sheet-backdrop]');
    const sheet = document.querySelector('[data-bottom-sheet]');
    const closeBtn = document.querySelector('[data-sheet-close]');
    const titleEl = document.querySelector('[data-sheet-title]');
    const dateLabelEl = document.querySelector('[data-sheet-date-label]');
    const sectionsEl = document.querySelector('[data-sheet-sections]');
    const handleEl = document.querySelector('[data-sheet-handle]');

    if (!backdrop || !sheet || !closeBtn || !titleEl || !dateLabelEl || !sectionsEl || !handleEl) {
        return;
    }

    let scrollLockY = 0;
    function lockScroll() {
        scrollLockY = window.scrollY || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        const y = top ? Math.abs(parseInt(top, 10)) : scrollLockY;
        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    let timetableData = {};
    const timetableScript = document.getElementById('timetableData');
    if (timetableScript && timetableScript.textContent) {
        try {
            timetableData = JSON.parse(timetableScript.textContent);
        } catch {
            timetableData = {};
        }
    }

    function openSheet() {
        lockScroll();
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full', 'opacity-0', 'pointer-events-none');
        sheet.classList.add('opacity-100');
        sheet.style.transform = '';
    }

    function closeSheet() {
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        backdrop.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full', 'opacity-0', 'pointer-events-none');
        sheet.classList.remove('opacity-100');
        sheet.style.transform = '';
        unlockScroll();
    }

    function esc(s) {
        return String(s)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function buildSection(label, html) {
        const wrapper = document.createElement('div');
        wrapper.className = 'p-4 rounded-xl border border-slate-200 bg-white';
        wrapper.innerHTML = `<p class="text-sm font-semibold text-slate-900 mb-2">${esc(label)}</p>${html}`;
        return wrapper;
    }

    function renderForDate(dateStr, items, events) {
        const dt = new Date(`${dateStr}T00:00:00`);
        const jsDow = dt.getDay();
        const dow = (jsDow + 6) % 7;
        const classes = timetableData[String(dow)] || [];

        dateLabelEl.textContent = dateStr;
        titleEl.textContent = 'Day Details';
        sectionsEl.innerHTML = '';

        if (Array.isArray(classes) && classes.length) {
            const list = classes
                .map((c) => (
                    `<div class="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <p class="text-sm font-semibold text-slate-900">${esc(c.subject)}</p>
                                <p class="text-xs text-slate-500 mt-1">${esc(c.room)} - ${esc(c.instructor)}</p>
                            </div>
                            <span class="minimal-badge bg-slate-100 text-slate-700">${esc(c.start_time)}-${esc(c.end_time)}</span>
                        </div>
                    </div>`
                ))
                .join('');
            sectionsEl.appendChild(buildSection('Weekly Classes', `<div class="space-y-3">${list}</div>`));
        }

        if (Array.isArray(events) && events.length) {
            const list = events
                .map((e) => (
                    `<div class="p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                        <p class="text-sm font-semibold text-slate-900">${esc(e.title)}</p>
                        <p class="text-xs text-slate-500 mt-1">${esc(e.location)} - ${esc(e.start_at)} -> ${esc(e.end_at)}</p>
                    </div>`
                ))
                .join('');
            sectionsEl.appendChild(buildSection('Scheduled Events', `<div class="space-y-3">${list}</div>`));
        }

        if (Array.isArray(items) && items.length) {
            const list = items
                .map((it) => {
                    const isHoliday = it.type === 'HOLIDAY';
                    const box = isHoliday
                        ? 'border-rose-200 bg-gradient-to-r from-rose-50 to-white'
                        : 'border-amber-200 bg-gradient-to-r from-amber-50 to-white';
                    const badge = isHoliday
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-700';
                    return `<div class="p-4 rounded-xl border ${box}">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <span class="minimal-badge ${badge}">${esc(it.type)}</span>
                                <p class="text-sm font-semibold text-slate-900 mt-2">${esc(it.title)}</p>
                                <p class="text-sm text-slate-600 mt-1">${esc(it.description)}</p>
                            </div>
                        </div>
                    </div>`;
                })
                .join('');
            sectionsEl.appendChild(buildSection('Special / Holidays', `<div class="space-y-3">${list}</div>`));
        }

        if (!classes.length && (!events || !events.length) && (!items || !items.length)) {
            sectionsEl.appendChild(buildSection('Nothing scheduled', '<p class="text-sm text-slate-500">No classes, events, or holidays found for this date.</p>'));
        }
    }

    calendarRoot.addEventListener('click', (e) => {
        const btn = e.target && e.target.closest ? e.target.closest('[data-cal-date]') : null;
        if (!btn || !calendarRoot.contains(btn)) {
            return;
        }
        const dateStr = btn.dataset.calDate;
        const items = btn.dataset.items ? JSON.parse(btn.dataset.items) : [];
        const events = btn.dataset.events ? JSON.parse(btn.dataset.events) : [];
        renderForDate(dateStr, items, events);
        openSheet();
    });

    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    let startY = 0;
    let currentY = 0;
    let dragging = false;
    let dragRaf = 0;
    let pendingDelta = 0;

    function onStart(e) {
        dragging = true;
        startY = (e.touches ? e.touches[0].clientY : e.clientY);
        currentY = startY;
        sheet.style.transition = 'none';
        sheet.style.willChange = 'transform';
    }

    function onMove(e) {
        if (!dragging) {
            return;
        }
        if (e.cancelable) {
            e.preventDefault();
        }
        currentY = (e.touches ? e.touches[0].clientY : e.clientY);
        pendingDelta = Math.max(0, currentY - startY);
        if (dragRaf) {
            return;
        }
        dragRaf = window.requestAnimationFrame(() => {
            dragRaf = 0;
            sheet.style.transform = `translateY(${pendingDelta}px)`;
        });
    }

    function onEnd() {
        if (!dragging) {
            return;
        }
        dragging = false;
        if (dragRaf) {
            window.cancelAnimationFrame(dragRaf);
            dragRaf = 0;
        }
        const delta = Math.max(0, currentY - startY);
        sheet.style.transition = '';
        sheet.style.transform = '';
        sheet.style.willChange = '';
        if (delta > 120) {
            closeSheet();
        }
    }

    handleEl.addEventListener('touchstart', onStart, { passive: true });
    handleEl.addEventListener('touchmove', onMove, { passive: false });
    handleEl.addEventListener('touchend', onEnd);

    handleEl.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
}

function initMobileNav() {
    const toggles = Array.from(document.querySelectorAll('[data-mobile-nav-toggle]'));
    const drawer = document.querySelector('[data-mobile-nav-drawer]');
    const backdrop = document.querySelector('[data-mobile-nav-backdrop]');

    if (!toggles.length || !drawer || !backdrop) {
        return;
    }

    function setExpanded(value) {
        toggles.forEach((t) => t.setAttribute('aria-expanded', value ? 'true' : 'false'));
    }

    function open() {
        drawer.classList.remove('-translate-x-full');
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100');
        setExpanded(true);
    }

    function close() {
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
        backdrop.classList.remove('opacity-100');
        setExpanded(false);
    }

    function toggleMenu() {
        const isOpen = !drawer.classList.contains('-translate-x-full');
        if (isOpen) {
            close();
        } else {
            open();
        }
    }

    toggles.forEach((t) => t.addEventListener('click', toggleMenu));
    backdrop.addEventListener('click', close);

    drawer.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', close);
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            close();
        }
    });
}

function initVaultBottomSheet() {
    const actionBtn = document.getElementById('vaultActionBtn');
    const bottomSheet = document.getElementById('vaultBottomSheet');
    const backdrop = document.getElementById('vaultSheetBackdrop');
    const sheet = document.getElementById('vaultSheet');
    const closeBtn = document.getElementById('vaultSheetClose');
    const handle = document.getElementById('vaultSheetHandle');
    const createFolderTab = document.getElementById('createFolderTab');
    const uploadFileTab = document.getElementById('uploadFileTab');
    const createFolderContent = document.getElementById('createFolderContent');
    const uploadFileContent = document.getElementById('uploadFileContent');

    if (!actionBtn || !bottomSheet || !backdrop || !sheet || !closeBtn || !handle) {
        return;
    }

    let scrollLockY = 0;
    let currentTab = 0; // 0 = create folder, 1 = upload file

    function lockScroll() {
        scrollLockY = window.scrollY || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        const y = top ? Math.abs(parseInt(top, 10)) : scrollLockY;
        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    function openSheet() {
        lockScroll();
        bottomSheet.classList.remove('opacity-0', 'pointer-events-none');
        bottomSheet.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
        backdrop.classList.remove('pointer-events-none');
        backdrop.classList.add('pointer-events-auto');
    }

    function closeSheet() {
        bottomSheet.classList.add('opacity-0', 'pointer-events-none');
        bottomSheet.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full');
        backdrop.classList.add('pointer-events-none');
        backdrop.classList.remove('pointer-events-auto');
        unlockScroll();
    }

    function switchTab(index) {
        currentTab = index;
        
        // Update tab buttons
        if (createFolderTab && uploadFileTab) {
            const isActive = index === 0;
            createFolderTab.classList.toggle('bg-white', isActive);
            createFolderTab.classList.toggle('text-slate-900', isActive);
            createFolderTab.classList.toggle('shadow-sm', isActive);
            createFolderTab.classList.toggle('text-slate-600', !isActive);
            
            uploadFileTab.classList.toggle('bg-white', !isActive);
            uploadFileTab.classList.toggle('text-slate-900', !isActive);
            uploadFileTab.classList.toggle('shadow-sm', !isActive);
            uploadFileTab.classList.toggle('text-slate-600', isActive);
        }
        
        // Update content
        if (createFolderContent && uploadFileContent) {
            createFolderContent.classList.toggle('hidden', currentTab !== 0);
            uploadFileContent.classList.toggle('hidden', currentTab !== 1);
        }
    }

    // Event listeners
    actionBtn.addEventListener('click', openSheet);
    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    if (createFolderTab) {
        createFolderTab.addEventListener('click', () => switchTab(0));
    }
    
    if (uploadFileTab) {
        uploadFileTab.addEventListener('click', () => switchTab(1));
    }

    // Swipe gesture handling
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let dragStartTime = 0;

    function handleTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
        dragStartTime = Date.now();
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - startX;
        const deltaY = currentY - startY;
        
        // Check if it's a horizontal swipe (more horizontal than vertical)
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
            // Prevent vertical scrolling during horizontal swipe
            e.preventDefault();
        }
    }

    function handleTouchEnd(e) {
        if (!isDragging) return;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const deltaTime = Date.now() - dragStartTime;
        
        // Check if it's a valid horizontal swipe
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) && deltaTime < 300) {
            if (deltaX > 0 && currentTab === 1) {
                // Swipe right - switch to create folder
                switchTab(0);
            } else if (deltaX < 0 && currentTab === 0) {
                // Swipe left - switch to upload file
                switchTab(1);
            }
        }
        
        isDragging = false;
    }

    // Add swipe listeners to the sheet content area
    const contentArea = sheet.querySelector('.px-6.pb-6');
    if (contentArea) {
        contentArea.addEventListener('touchstart', handleTouchStart, { passive: true });
        contentArea.addEventListener('touchmove', handleTouchMove, { passive: false });
        contentArea.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Handle sheet drag to close
    let dragStartY = 0;
    let currentDragY = 0;
    let isDraggingSheet = false;

    function handleSheetDragStart(e) {
        dragStartY = e.touches ? e.touches[0].clientY : e.clientY;
        currentDragY = dragStartY;
        isDraggingSheet = true;
        sheet.style.transition = 'none';
        sheet.style.willChange = 'transform';
    }

    function handleSheetDragMove(e) {
        if (!isDraggingSheet) return;
        if (e.cancelable) {
            e.preventDefault();
        }
        
        currentDragY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = Math.max(0, currentDragY - dragStartY);
        sheet.style.transform = `translateY(${deltaY}px)`;
    }

    function handleSheetDragEnd() {
        if (!isDraggingSheet) return;
        
        isDraggingSheet = false;
        sheet.style.transition = '';
        sheet.style.transform = '';
        sheet.style.willChange = '';
        
        const deltaY = Math.max(0, currentDragY - dragStartY);
        if (deltaY > 120) {
            closeSheet();
        }
    }

    handle.addEventListener('touchstart', handleSheetDragStart, { passive: true });
    handle.addEventListener('touchmove', handleSheetDragMove, { passive: false });
    handle.addEventListener('touchend', handleSheetDragEnd);

    handle.addEventListener('mousedown', handleSheetDragStart);
    window.addEventListener('mousemove', handleSheetDragMove);
    window.addEventListener('mouseup', handleSheetDragEnd);

    // Initialize first tab
    switchTab(0);
}

function initVaultPageBottomSheet() {
    const actionBtn = document.getElementById('vaultPageActionBtn');
    const bottomSheet = document.getElementById('vaultPageBottomSheet');
    const backdrop = document.getElementById('vaultPageSheetBackdrop');
    const sheet = document.getElementById('vaultPageSheet');
    const closeBtn = document.getElementById('vaultPageSheetClose');
    const handle = document.getElementById('vaultPageSheetHandle');
    const createFolderTab = document.getElementById('vaultPageCreateFolderTab');
    const uploadFileTab = document.getElementById('vaultPageUploadFileTab');
    const createFolderContent = document.getElementById('vaultPageCreateFolderContent');
    const uploadFileContent = document.getElementById('vaultPageUploadFileContent');

    if (!actionBtn || !bottomSheet || !backdrop || !sheet || !closeBtn || !handle) {
        return;
    }

    let scrollLockY = 0;
    let currentTab = 0;

    function lockScroll() {
        scrollLockY = window.scrollY || 0;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollLockY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
    }

    function unlockScroll() {
        document.body.style.position = '';
        const top = document.body.style.top;
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        const y = top ? Math.abs(parseInt(top, 10)) : scrollLockY;
        window.scrollTo(0, Number.isFinite(y) ? y : 0);
    }

    function openSheet() {
        lockScroll();
        bottomSheet.classList.remove('opacity-0', 'pointer-events-none');
        bottomSheet.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
        backdrop.classList.remove('pointer-events-none');
        backdrop.classList.add('pointer-events-auto');
    }

    function closeSheet() {
        bottomSheet.classList.add('opacity-0', 'pointer-events-none');
        bottomSheet.classList.remove('opacity-100');
        sheet.classList.add('translate-y-full');
        backdrop.classList.add('pointer-events-none');
        backdrop.classList.remove('pointer-events-auto');
        unlockScroll();
    }

    function switchTab(index) {
        currentTab = index;
        if (createFolderTab && uploadFileTab) {
            const isActive = index === 0;
            createFolderTab.classList.toggle('bg-white', isActive);
            createFolderTab.classList.toggle('text-slate-900', isActive);
            createFolderTab.classList.toggle('shadow-sm', isActive);
            createFolderTab.classList.toggle('text-slate-600', !isActive);

            uploadFileTab.classList.toggle('bg-white', !isActive);
            uploadFileTab.classList.toggle('text-slate-900', !isActive);
            uploadFileTab.classList.toggle('shadow-sm', !isActive);
            uploadFileTab.classList.toggle('text-slate-600', isActive);
        }

        if (createFolderContent && uploadFileContent) {
            createFolderContent.classList.toggle('hidden', currentTab !== 0);
            uploadFileContent.classList.toggle('hidden', currentTab !== 1);
        }
    }

    actionBtn.addEventListener('click', openSheet);
    closeBtn.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);

    if (createFolderTab) {
        createFolderTab.addEventListener('click', () => switchTab(0));
    }
    if (uploadFileTab) {
        uploadFileTab.addEventListener('click', () => switchTab(1));
    }

    let dragStartY = 0;
    let currentDragY = 0;
    let isDraggingSheet = false;

    function handleSheetDragStart(e) {
        dragStartY = e.touches ? e.touches[0].clientY : e.clientY;
        currentDragY = dragStartY;
        isDraggingSheet = true;
        sheet.style.transition = 'none';
        sheet.style.willChange = 'transform';
    }

    function handleSheetDragMove(e) {
        if (!isDraggingSheet) return;
        if (e.cancelable) {
            e.preventDefault();
        }
        currentDragY = e.touches ? e.touches[0].clientY : e.clientY;
        const deltaY = Math.max(0, currentDragY - dragStartY);
        sheet.style.transform = `translateY(${deltaY}px)`;
    }

    function handleSheetDragEnd() {
        if (!isDraggingSheet) return;
        isDraggingSheet = false;
        const deltaY = Math.max(0, currentDragY - dragStartY);
        sheet.style.transition = '';
        sheet.style.transform = '';
        sheet.style.willChange = '';
        if (deltaY > 120) {
            closeSheet();
        }
    }

    handle.addEventListener('touchstart', handleSheetDragStart, { passive: true });
    handle.addEventListener('touchmove', handleSheetDragMove, { passive: false });
    handle.addEventListener('touchend', handleSheetDragEnd);

    handle.addEventListener('mousedown', handleSheetDragStart);
    window.addEventListener('mousemove', handleSheetDragMove);
    window.addEventListener('mouseup', handleSheetDragEnd);

    switchTab(0);
}

function initVaultFileManager() {
    const input = document.getElementById('vaultSearch');
    const list = document.getElementById('vaultFileList');
    const totalEl = document.getElementById('vaultTotal');
    const visibleEl = document.getElementById('vaultVisible');

    if (!input || !list || !totalEl || !visibleEl) {
        return;
    }

    const bulkBar = document.getElementById('vaultBulkBar');
    const selectedCountEl = document.getElementById('vaultSelectedCount');
    const selectAll = document.getElementById('vaultSelectAll');
    const clearBtn = document.getElementById('vaultClearSelection');
    const bulkDeleteForm = document.getElementById('vaultBulkDeleteForm');
    const bulkMoveForm = document.getElementById('vaultBulkMoveForm');
    const bulkCopyForm = document.getElementById('vaultBulkCopyForm');

    const items = Array.from(list.querySelectorAll('[data-vault-file]'));
    totalEl.textContent = String(items.length);

    function getCheckboxes() {
        return Array.from(list.querySelectorAll('.vault-file-checkbox'));
    }

    function selectedIds() {
        return getCheckboxes()
            .filter((c) => c.checked)
            .map((c) => String(c.value || '').trim())
            .filter(Boolean);
    }

    function clearDynamicInputs(form) {
        if (!form) return;
        form.querySelectorAll('input[data-vault-dyn="1"]').forEach((el) => el.remove());
    }

    function fillBulkForm(form) {
        if (!form) return;
        clearDynamicInputs(form);
        selectedIds().forEach((id) => {
            const inp = document.createElement('input');
            inp.type = 'hidden';
            inp.name = 'file_ids';
            inp.value = id;
            inp.setAttribute('data-vault-dyn', '1');
            form.appendChild(inp);
        });
    }

    function updateSelectionUI() {
        const ids = selectedIds();
        if (selectedCountEl) {
            selectedCountEl.textContent = String(ids.length);
        }
        if (bulkBar) {
            bulkBar.classList.toggle('hidden', ids.length === 0);
        }
        if (selectAll) {
            const boxes = getCheckboxes();
            const all = boxes.length > 0 && boxes.every((c) => c.checked);
            const none = boxes.every((c) => !c.checked);
            selectAll.indeterminate = !all && !none;
            selectAll.checked = all;
        }
    }

    function applyFilter() {
        const q = (input.value || '').trim().toLowerCase();
        let visible = 0;
        items.forEach((el) => {
            const hay = String(el.dataset.searchText || '');
            const ok = !q || hay.includes(q);
            el.style.display = ok ? '' : 'none';
            if (ok) {
                visible += 1;
            }
        });
        visibleEl.textContent = String(visible);
    }

    input.addEventListener('input', applyFilter);
    applyFilter();

    list.addEventListener('change', (e) => {
        const target = e.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (target.classList.contains('vault-file-checkbox')) {
            updateSelectionUI();
        }
    });

    if (selectAll) {
        selectAll.addEventListener('change', () => {
            const checked = !!selectAll.checked;
            getCheckboxes().forEach((c) => {
                c.checked = checked;
            });
            updateSelectionUI();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            getCheckboxes().forEach((c) => {
                c.checked = false;
            });
            updateSelectionUI();
        });
    }

    function bindBulkForm(form) {
        if (!form) return;
        form.addEventListener('submit', () => fillBulkForm(form));
    }
    bindBulkForm(bulkDeleteForm);
    bindBulkForm(bulkMoveForm);
    bindBulkForm(bulkCopyForm);

    async function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
    }

    list.querySelectorAll('.vaultShareBtn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const row = btn.closest('[data-vault-file]');
            if (!row) return;
            const url = row.getAttribute('data-download-url') || '';
            const name = row.querySelector('p')?.textContent?.trim() || 'Vault file';
            const absUrl = new URL(url, window.location.origin).toString();
            try {
                if (navigator.share) {
                    await navigator.share({ title: name, text: name, url: absUrl });
                    return;
                }
            } catch {
                // fall through to copy
            }
            try {
                await copyText(absUrl);
                window.alert('Link copied');
            } catch {
                window.prompt('Copy link:', absUrl);
            }
        });
    });

    updateSelectionUI();
}

document.addEventListener('DOMContentLoaded', () => {
    initPageProgress();
    initTapFeedback();
    generateAttendance();
    applyAttendanceRings();
    initUxReveal();
    initWeeklyTimetable();
    initScheduleCalendarSheet();
    initMobileNav();
    initVaultBottomSheet();
    initVaultPageBottomSheet();
    initVaultFileManager();
    initChangePasswordBottomSheet();
    initAdminChangePasswordBottomSheet();
    initLibraryFiltersBottomSheet();
    initNewsFiltersBottomSheet();

    const subtitle = document.getElementById('headerSubtitle');
    if (subtitle && subtitle.dataset.autodate === 'true') {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        subtitle.textContent = today.toLocaleDateString('en-US', options);
    }
});

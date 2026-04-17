const html = document.documentElement;
const savedTheme = localStorage.getItem('socrat-theme') || 'light';
html.setAttribute('data-theme', savedTheme);

function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('socrat-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    const pageToggle = document.getElementById('theme-toggle');
    if (pageToggle) pageToggle.checked = theme === 'dark';
}

function toggleTheme() {
    const current = html.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
}

function updateThemeIcon(t) {
    const themeIcon = document.querySelector('#theme-toggle i');
    if (themeIcon) themeIcon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function setLang(lang, save = true) {
    html.setAttribute('data-lang', lang);
    if (save) localStorage.setItem('socrat-lang', lang);
    const btnRu = document.getElementById('btn-ru');
    const btnKz = document.getElementById('btn-kz');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
    if (btnKz) btnKz.classList.toggle('active', lang === 'kz');
    html.lang = lang === 'kz' ? 'kk' : 'ru';
    document.documentElement.dataset.lang = lang;
}

function getCsrfToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
        c = c.trim();
        if (c.startsWith(name + '=')) {
            return decodeURIComponent(c.slice(name.length + 1));
        }
    }
    return '';
}

function showToast(message, type = 'info') {
    const pageToast = document.getElementById('toast');
    if (pageToast) {
        pageToast.textContent = message;
        pageToast.style.background = type === 'error' ? '#FF4757' : type === 'success' ? 'var(--primary)' : '#1E90FF';
        pageToast.classList.add('show');
        setTimeout(() => pageToast.classList.remove('show'), 3000);
        return;
    }

    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    let icon = 'fa-info-circle';
    let color = 'var(--primary)';
    if (type === 'success') { icon = 'fa-check-circle'; color = 'var(--primary)'; }
    if (type === 'error') { icon = 'fa-exclamation-circle'; color = 'var(--danger)'; }
    if (type === 'warning') { icon = 'fa-exclamation-triangle'; color = 'var(--warning)'; }

    toast.style.borderLeftColor = color;
    toast.innerHTML = `<i class="fas ${icon}" style="color: ${color}"></i> <span>${message}</span>`;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function openModal(tab) {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    switchTab(tab || 'login');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

function switchTab(tab) {
    document.querySelectorAll('.modal-tab').forEach((b, i) => b.classList.toggle('active', (i === 0) === (tab === 'login')));
    const loginTab = document.getElementById('tab-login');
    const registerTab = document.getElementById('tab-register');
    if (loginTab) loginTab.classList.toggle('active', tab === 'login');
    if (registerTab) registerTab.classList.toggle('active', tab === 'register');
}

function showAuthError(msg) {
    let el = document.getElementById('auth-error');
    if (!el) {
        el = document.createElement('div');
        el.id = 'auth-error';
        el.style.cssText = 'background:#ff4757;color:white;padding:10px 16px;border-radius:12px;margin-bottom:12px;font-size:0.88rem;font-weight:600;';
        const loginSection = document.getElementById('tab-login');
        if (loginSection) loginSection.prepend(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
}

function hideAuthError() {
    const el = document.getElementById('auth-error');
    if (el) el.style.display = 'none';
}

function initNeuralBG() {
    const bgCanvas = document.getElementById('bg-neural-canvas');
    if (!bgCanvas) return;
    for (let i = 0; i < 100; i++) {
        const node = document.createElement('div');
        node.className = 'neural-node';
        node.style.top = `${Math.random() * 100}%`;
        node.style.left = `${Math.random() * 100}%`;
        node.style.animationDelay = `${Math.random() * 5}s`;
        bgCanvas.appendChild(node);
    }
    for (let i = 0; i < 50; i++) {
        const conn = document.createElement('div');
        conn.className = 'neural-connection';
        conn.style.top = `${Math.random() * 100}%`;
        conn.style.left = `${Math.random() * 100}%`;
        conn.style.width = `${100 + Math.random() * 300}px`;
        conn.style.transform = `rotate(${Math.random() * 360}deg)`;
        conn.style.animationDelay = `${Math.random() * 5}s`;
        bgCanvas.appendChild(conn);
    }
}

function animateCount(el, target, duration = 1500) {
    const start = performance.now();
    const update = time => {
        const p = Math.min((time - start) / duration, 1);
        el.textContent = Math.round(p * target);
        if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}

function initIndexPage() {
    if (window.AOS) AOS.init({ duration: 1000, once: true });

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', next);
            localStorage.setItem('socrat-theme', next);
            updateThemeIcon(next);
        });
    }

    const savedLang = localStorage.getItem('socrat-lang') || 'ru';
    setLang(savedLang, false);
    updateThemeIcon(savedTheme);

    const faqHeaders = document.querySelectorAll('.faq-header-faq-header');
    faqHeaders.forEach(h => {
        h.addEventListener('click', () => h.parentElement.classList.toggle('faq-item-active-faq-item-active'));
    });

    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', e => {
            if (e.target === e.currentTarget) closeModal();
        });
    }

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

    initNeuralBG();

    const aiVisualCore = document.getElementById('ai-visual-core');
    if (aiVisualCore) {
        document.addEventListener('mousemove', e => {
            const x = (window.innerWidth / 2 - e.pageX) / 40;
            const y = (window.innerHeight / 2 - e.pageY) / 40;
            aiVisualCore.style.transform = `rotateY(${x}deg) rotateX(${y + 10}deg)`;
        });
    }

    const floatingNavbar = document.getElementById('floating-navbar');
    if (floatingNavbar) {
        window.addEventListener('scroll', () => {
            floatingNavbar.classList.toggle('navbar-scrolled', window.scrollY > 50);
        });
    }

    const strip = document.querySelector('.stat-strip');
    if (strip) {
        const statObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.stat-num').forEach(el => {
                        const v = parseInt(el.textContent, 10);
                        if (v > 0) animateCount(el, v);
                    });
                    statObserver.disconnect();
                }
            });
        }, { threshold: 0.5 });
        statObserver.observe(strip);
    }

    const loginBtn = document.querySelector('#tab-login .btn-primary-elite');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            hideAuthError();
            const email = document.querySelector('#tab-login input[type="email"]').value.trim();
            const password = document.querySelector('#tab-login input[type="password"]').value;
            if (!email || !password) { showAuthError('Заполните все поля'); return; }
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            // Simplified: just redirect to dashboard
            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 500); // Small delay for UX
        });
    }

    const regBtn = document.querySelector('#tab-register .btn-primary-elite');
    if (regBtn) {
        regBtn.addEventListener('click', () => {
            hideAuthError();
            const name = document.querySelector('#tab-register input[type="text"]').value.trim();
            const email = document.querySelector('#tab-register input[type="email"]').value.trim();
            const password = document.querySelector('#tab-register input[type="password"]').value;
            if (!name || !email || !password) { showAuthError('Заполните все поля'); return; }
            if (password.length < 6) { showAuthError('Пароль минимум 6 символов'); return; }
            regBtn.disabled = true;
            regBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            // Simplified: just redirect to dashboard
            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 500); // Small delay for UX
        });
    }
}

class SocratApp {
    constructor() {
        this.tasks = [];
        this.draggedTask = null;
        this.chartData = [12, 19, 15, 25, 22, 30, 28];
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkTheme();
        this.renderKanban();
        this.initRipple();
        this.animateXpRing();
        this.renderChart();
        this.renderHeatmap();
        this.loadUser();
        this.loadTasks();
        this.loadSessions();

        if (window.location.hash === '#library') {
            setTimeout(() => this.navigate('library'), 100);
        }

        document.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('.settings-nav-item').forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    checkTheme() {
        const savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.checked = (savedTheme === 'dark');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    getCsrfToken() {
        const name = 'csrftoken';
        for (let c of document.cookie.split(';')) {
            c = c.trim();
            if (c.startsWith(name + '=')) return decodeURIComponent(c.slice(name.length + 1));
        }
        return '';
    }

    async loadUser() {
        try {
            const res = await fetch('/me', { credentials: 'include' });
            if (res.status === 401) { window.location.href = '/'; return; }
            if (!res.ok) return;
            const data = await res.json();
            this.currentUser = data;
            const name = data.name || data.username || 'Пользователь';
            const letter = name[0].toUpperCase();
            const topbarUsername = document.getElementById('topbar-username');
            const topbarAvatar = document.getElementById('topbar-avatar');
            const settingsAvatar = document.getElementById('settings-avatar');
            const settingsNameDisplay = document.getElementById('settings-name-display');
            const settingsEmailDisplay = document.getElementById('settings-email-display');
            if (topbarUsername) topbarUsername.textContent = name;
            if (topbarAvatar) topbarAvatar.textContent = letter;
            const welcomeHeading = document.getElementById('welcome-heading');
            if (welcomeHeading) welcomeHeading.textContent = `С возвращением, ${name}! ✨`;
            if (settingsAvatar) settingsAvatar.childNodes[0].textContent = letter;
            if (settingsNameDisplay) settingsNameDisplay.textContent = name;
            if (settingsEmailDisplay) settingsEmailDisplay.textContent = data.email || '';
            const settingsNameInput = document.getElementById('settings-name');
            const settingsEmailInput = document.getElementById('settings-email');
            if (settingsNameInput) settingsNameInput.value = name;
            if (settingsEmailInput) settingsEmailInput.value = data.email || '';
        } catch (e) {
            console.error('loadUser error', e);
        }
    }

    async loadTasks() {
        try {
            const res = await fetch('/tasks', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            this.tasks = data.tasks || [];
            this.renderKanban();
        } catch (e) {
            console.error('loadTasks error', e);
        }
    }

    async loadSessions() {
        try {
            const res = await fetch('/sessions', { credentials: 'include' });
            if (!res.ok) return;
            const data = await res.json();
            const sessions = data.sessions || [];
            const grid = document.getElementById('sessions-grid');
            if (!grid) return;
            const startCard = grid.querySelector('.card');
            grid.innerHTML = '';
            if (startCard) grid.appendChild(startCard);
            sessions.forEach(s => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <div class="card-icon" style="background: rgba(30,144,255,0.1); color: #1E90FF;">
                        <i class="fas fa-comments"></i>
                    </div>
                    <h3 style="font-size:1rem; margin-bottom:8px;">${s.title}</h3>
                    <p>${s.preview || 'Занятие с Сократом'}</p>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:15px;">${s.updated_at}</div>
                    <button class="btn btn-secondary ripple-btn" onclick="window.location.href='/dashboard/?session_id=${s.id}'">Продолжить <i class="fas fa-arrow-right"></i></button>
                `;
                grid.appendChild(card);
            });
        } catch (e) {
            console.error('loadSessions error', e);
        }
    }

    async saveProfile() {
        const name = document.getElementById('settings-name')?.value.trim();
        if (!name) { this.showToast('Введите имя', 'error'); return; }
        try {
            const res = await fetch('/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCsrfToken() },
                credentials: 'include',
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                this.showToast('Настройки сохранены', 'success');
                await this.loadUser();
            } else {
                this.showToast('Ошибка сохранения', 'error');
            }
        } catch (e) {
            this.showToast('Ошибка сети', 'error');
        }
    }

    navigate(pageId) {
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (!targetPage) return;
        targetPage.style.display = 'block';
        setTimeout(() => targetPage.classList.add('active'), 10);
        const navLink = document.querySelector(`[data-target="${pageId}"]`);
        if (navLink) navLink.classList.add('active');
        if (pageId === 'stats') setTimeout(() => this.renderChart(), 300);
        if (pageId === 'library') this.loadLibrary();
    }

    async loadLibrary() {
        const grid = document.getElementById('library-grid');
        if (!grid) return;
        grid.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:40px;"><i class="fas fa-circle-notch fa-spin"></i> Загрузка...</p>';
        try {
            const res = await fetch('/library', { credentials: 'include' });
            if (!res.ok) throw new Error();
            const data = await res.json();
            const items = data.items || [];
            if (items.length === 0) {
                grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:60px; color:var(--text-muted);">
                    <i class="fas fa-book-open" style="font-size:3rem; opacity:0.3; margin-bottom:20px; display:block;"></i>
                    <p>Библиотека пуста. Нажмите «Добавить материал»</p>
                </div>`;
                return;
            }
            const icons  = { course: 'fa-graduation-cap', note: 'fa-sticky-note', link: 'fa-link', file: 'fa-file' };
            const colors = { course: 'bg-gradient-2', note: 'bg-gradient-3', link: 'bg-gradient-1', file: 'bg-gradient-1' };
            grid.innerHTML = items.map(item => `
                <div class="card">
                    <div class="card-icon ${colors[item.item_type] || 'bg-gradient-2'}">
                        <i class="fas ${icons[item.item_type] || 'fa-book'}"></i>
                    </div>
                    <h3>${item.title}</h3>
                    <p>${item.description || '&nbsp;'}</p>
                    ${item.file_url ? `<a href="${item.file_url}" target="_blank" style="font-size:0.85rem; color:var(--primary); font-weight:700; display:block; margin-bottom:10px;"><i class="fas fa-download"></i> ${item.file_name}</a>` : ''}
                    <div class="task-footer" style="margin-top:auto;">
                        <span class="task-date"><i class="far fa-calendar-alt"></i> ${item.created_at}</span>
                        <button class="task-actions-btn" onclick="app.deleteLibraryItem(${item.id})"><i class="far fa-trash-alt"></i></button>
                    </div>
                </div>
            `).join('');
        } catch (e) {
            grid.innerHTML = '<p style="color:var(--danger); text-align:center; padding:40px;">Ошибка загрузки библиотеки</p>';
        }
    }

    openAddLibraryModal() {
        document.getElementById('library-modal')?.classList.add('active');
        if (document.getElementById('lib-title')) document.getElementById('lib-title').value = '';
        if (document.getElementById('lib-desc')) document.getElementById('lib-desc').value = '';
        if (document.getElementById('lib-type')) document.getElementById('lib-type').value = 'note';
        if (document.getElementById('lib-file-group')) document.getElementById('lib-file-group').style.display = 'none';
        if (document.getElementById('lib-file')) document.getElementById('lib-file').value = '';
    }

    onLibTypeChange() {
        const type = document.getElementById('lib-type')?.value;
        if (document.getElementById('lib-file-group')) document.getElementById('lib-file-group').style.display = type === 'file' ? 'block' : 'none';
    }

    closeLibraryModal() {
        document.getElementById('library-modal')?.classList.remove('active');
    }

    async saveLibraryItem() {
        const title = document.getElementById('lib-title')?.value.trim();
        if (!title) { this.showToast('Введите название', 'error'); return; }
        const desc = document.getElementById('lib-desc')?.value.trim();
        const item_type = document.getElementById('lib-type')?.value;
        const fileInput = document.getElementById('lib-file');
        const file = fileInput?.files[0];
        try {
            let res;
            if (file) {
                const fd = new FormData();
                fd.append('title', title);
                fd.append('description', desc);
                fd.append('item_type', item_type);
                fd.append('file', file);
                res = await fetch('/library', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': this.getCsrfToken() },
                    credentials: 'include',
                    body: fd,
                });
            } else {
                res = await fetch('/library', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCsrfToken() },
                    credentials: 'include',
                    body: JSON.stringify({ title, description: desc, item_type }),
                });
            }
            if (!res.ok) throw new Error();
            this.closeLibraryModal();
            this.loadLibrary();
            this.showToast('Материал добавлен', 'success');
        } catch (e) {
            this.showToast('Ошибка сохранения', 'error');
        }
    }

    async deleteLibraryItem(id) {
        if (!confirm('Удалить материал?')) return;
        try {
            await fetch(`/library/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRFToken': this.getCsrfToken() },
                credentials: 'include',
            });
            this.loadLibrary();
        } catch (e) {
            this.showToast('Ошибка удаления', 'error');
        }
    }

    checkTheme() {
        const savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.checked = (savedTheme === 'dark');
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    async logout() {
        try {
            const response = await fetch('/logout', {
                method: 'POST',
                headers: { 'X-CSRFToken': this.getCsrfToken() },
                credentials: 'include',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) throw new Error(data.error || 'Logout failed');
            window.location.href = data.redirect || '/';
        } catch (error) {
            this.showToast('Не удалось выйти из аккаунта', 'error');
        }
    }

    showToast(message, type = 'info') {
        showToast(message, type);
    }

    initRipple() {
        document.querySelectorAll('.ripple-btn, .nav-link').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left = `${e.clientX - rect.left}px`;
                ripple.style.top = `${e.clientY - rect.top}px`;
                ripple.style.width = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    animateXpRing() {
        setTimeout(() => {
            const ring = document.getElementById('xp-ring');
            if (!ring) return;
            const percent = 65;
            const circumference = 2 * Math.PI * 28;
            ring.style.strokeDashoffset = circumference - (percent / 100) * circumference;
        }, 500);
    }

    renderKanban() {
        const columns = { backlog: [], sprint: [], done: [] };
        this.tasks.forEach(t => columns[t.status]?.push(t));
        ['backlog', 'sprint', 'done'].forEach(status => {
            const container = document.getElementById(`list-${status}`);
            if (!container) return;
            document.getElementById(`count-${status}`).innerText = columns[status].length;
            container.innerHTML = '';
            columns[status].forEach(task => {
                const el = document.createElement('div');
                el.className = 'task-card';
                el.draggable = true;
                el.id = task.id;
                let tagClass = 'tag-study', tagName = 'Обучение';
                if (task.tag === 'urgent') { tagClass = 'tag-urgent'; tagName = 'Срочно'; }
                if (task.tag === 'project') { tagClass = 'tag-project'; tagName = 'Проект'; }
                el.innerHTML = `
                    <div class="task-tag ${tagClass}">${tagName}</div>
                    <div class="task-title">${task.title}</div>
                    <div class="task-desc">${task.desc}</div>
                    <div class="task-footer">
                        <div class="task-date"><i class="far fa-calendar-alt"></i> ${task.date || 'Без срока'}</div>
                        <button class="task-actions-btn" onclick="app.deleteTask('${task.id}')"><i class="far fa-trash-alt"></i></button>
                    </div>
                `;
                el.addEventListener('dragstart', () => {
                    this.draggedTask = task.id;
                    setTimeout(() => el.classList.add('dragging'), 0);
                });
                el.addEventListener('dragend', () => {
                    el.classList.remove('dragging');
                    this.draggedTask = null;
                    document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
                });
                container.appendChild(el);
            });
        });
    }

    allowDrop(e) { e.preventDefault(); }

    dragEnter(e) {
        e.preventDefault();
        const col = e.target.closest('.kanban-col');
        if (col) col.classList.add('drag-over');
    }

    dragLeave(e) {
        const col = e.target.closest('.kanban-col');
        if (col) col.classList.remove('drag-over');
    }

    drop(e, status) {
        e.preventDefault();
        document.querySelectorAll('.kanban-col').forEach(c => c.classList.remove('drag-over'));
        if (!this.draggedTask) return;
        const idx = this.tasks.findIndex(t => t.id === this.draggedTask);
        if (idx > -1 && this.tasks[idx].status !== status) {
            const taskId = this.tasks[idx].id;
            this.tasks[idx].status = status;
            this.renderKanban();
            if (status === 'done') this.showToast('Задача выполнена!', 'success');
            fetch(`/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCsrfToken() },
                credentials: 'include',
                body: JSON.stringify({ status }),
            }).catch(() => {});
        }
    }

    async deleteTask(id) {
        try {
            await fetch(`/tasks/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRFToken': this.getCsrfToken() },
                credentials: 'include',
            });
        } catch (e) { }
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.renderKanban();
        this.showToast('Задача удалена', 'info');
    }

    openTaskModal() {
        document.getElementById('task-modal')?.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('task-modal')?.classList.remove('active');
        if (document.getElementById('new-task-title')) document.getElementById('new-task-title').value = '';
        if (document.getElementById('new-task-desc')) document.getElementById('new-task-desc').value = '';
        if (document.getElementById('new-task-date')) document.getElementById('new-task-date').value = '';
    }

    async createTask() {
        const title = document.getElementById('new-task-title')?.value.trim();
        const desc = document.getElementById('new-task-desc')?.value.trim();
        const tag = document.getElementById('new-task-tag')?.value;
        const date = document.getElementById('new-task-date')?.value;
        if (!title) { this.showToast('Введите название задачи', 'error'); return; }
        try {
            const res = await fetch('/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': this.getCsrfToken() },
                credentials: 'include',
                body: JSON.stringify({ title, desc, tag, date, status: 'backlog' }),
            });
            if (!res.ok) throw new Error();
            const task = await res.json();
            this.tasks.push(task);
            this.renderKanban();
            this.closeTaskModal();
            this.showToast('Задача успешно создана', 'success');
        } catch (e) {
            this.showToast('Ошибка создания задачи', 'error');
        }
    }

    addInterest(e, input) {
        if (e.key === 'Enter' && input.value.trim()) {
            const container = document.getElementById('interest-container');
            if (!container) return;
            const newTag = document.createElement('div');
            newTag.className = 'interest-tag active';
            newTag.innerHTML = `<i class="fas fa-hashtag"></i> ${input.value.trim()}`;
            newTag.onclick = () => newTag.classList.toggle('active');
            container.insertBefore(newTag, input.parentElement);
            input.value = '';
            this.showToast('Интерес добавлен', 'success');
        }
    }

    renderChart() {
        const container = document.getElementById('main-chart-container');
        if (!container) return;
        container.innerHTML = '';
        const width = container.clientWidth;
        const height = container.clientHeight;
        const padding = 40;
        const data = this.chartData;
        const maxVal = Math.max(...data) * 1.2;
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        const textColor = isDark ? '#7A8580' : '#8E9894';
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', 'areaGradient');
        gradient.setAttribute('x1', '0%'); gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '0%'); gradient.setAttribute('y2', '100%');
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'var(--primary)');
        stop1.setAttribute('stop-opacity', '0.5');
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'var(--primary)');
        stop2.setAttribute('stop-opacity', '0');
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        svg.appendChild(defs);
        for (let i = 0; i < 5; i++) {
            const y = padding + (height - 2 * padding) * (i / 4);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', padding); line.setAttribute('y1', y);
            line.setAttribute('x2', width - padding); line.setAttribute('y2', y);
            line.setAttribute('stroke', gridColor); line.setAttribute('stroke-width', '1');
            line.setAttribute('stroke-dasharray', '5,5');
            svg.appendChild(line);
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', padding - 10); text.setAttribute('y', y + 4);
            text.setAttribute('text-anchor', 'end'); text.setAttribute('fill', textColor);
            text.setAttribute('font-size', '12px'); text.setAttribute('font-weight', '600');
            text.textContent = Math.round(maxVal * (1 - i / 4));
            svg.appendChild(text);
        }
        const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const points = data.map((val, i) => ({
            x: padding + (width - 2 * padding) * (i / (data.length - 1)),
            y: height - padding - ((val / maxVal) * (height - 2 * padding)),
            val, day: days[i],
        }));
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
            const cp2x = points[i].x - (points[i].x - points[i - 1].x) / 2;
            pathD += ` C ${cp1x} ${points[i - 1].y}, ${cp2x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
        }
        const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
        const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        areaPath.setAttribute('d', areaD);
        areaPath.setAttribute('fill', 'url(#areaGradient)');
        const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        linePath.setAttribute('d', pathD);
        linePath.setAttribute('fill', 'none');
        linePath.setAttribute('stroke', 'var(--primary)');
        linePath.setAttribute('stroke-width', '4');
        linePath.setAttribute('stroke-linecap', 'round');
        linePath.setAttribute('stroke-dasharray', 2000);
        linePath.setAttribute('stroke-dashoffset', 2000);
        svg.appendChild(areaPath);
        svg.appendChild(linePath);
        setTimeout(() => {
            linePath.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
            linePath.setAttribute('stroke-dashoffset', '0');
        }, 100);
        const tooltip = document.getElementById('chart-tooltip');
        points.forEach(p => {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', p.x); text.setAttribute('y', height - 15);
            text.setAttribute('text-anchor', 'middle'); text.setAttribute('fill', textColor);
            text.setAttribute('font-size', '12px'); text.setAttribute('font-weight', '700');
            text.textContent = p.day;
            svg.appendChild(text);
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', p.x); circle.setAttribute('cy', p.y); circle.setAttribute('r', '6');
            circle.setAttribute('fill', 'var(--card-bg)');
            circle.setAttribute('stroke', 'var(--primary)'); circle.setAttribute('stroke-width', '3');
            circle.style.cursor = 'pointer';
            circle.style.transition = 'all 0.2s';
            circle.style.transformOrigin = `${p.x}px ${p.y}px`;
            circle.addEventListener('mouseenter', () => {
                circle.style.transform = 'scale(1.5)';
                circle.setAttribute('fill', 'var(--primary)');
                if (tooltip) {
                    tooltip.textContent = `${p.day}: ${p.val} очков`;
                    tooltip.style.opacity = '1';
                    tooltip.style.left = `${p.x}px`;
                    tooltip.style.top = `${p.y - 40}px`;
                }
            });
            circle.addEventListener('mouseleave', () => {
                circle.style.transform = 'scale(1)';
                circle.setAttribute('fill', 'var(--card-bg)');
                if (tooltip) tooltip.style.opacity = '0';
            });
            svg.appendChild(circle);
        });
        container.appendChild(svg);
    }

    renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 42; i++) {
            const rect = document.createElement('div');
            rect.style.width = '100%';
            rect.style.paddingBottom = '100%';
            rect.style.borderRadius = '4px';
            const val = Math.random();
            if (val > 0.8) rect.style.background = 'var(--primary-dark)';
            else if (val > 0.5) rect.style.background = 'var(--primary)';
            else if (val > 0.2) rect.style.background = 'var(--primary-light)';
            else rect.style.background = 'var(--bg-body)';
            rect.style.opacity = '0';
            rect.style.animation = `scaleIn 0.3s forwards ${i * 0.02}s`;
            container.appendChild(rect);
        }
    }
}

let app = null;

function initDashboardPage() {
    app = new SocratApp();
    window.addEventListener('resize', () => {
        if (document.getElementById('stats')?.classList.contains('active')) {
            app.renderChart();
        }
    });
}

let chatHistory = [];
let isStreaming = false;
let currentUser = null;
let currentSessionId = null;
const moodState = {
    current: 'neutral',
    set(value) { this.current = value; },
    get() { return this.current; },
};
const notesState = {
    content: localStorage.getItem('socrat-notes') || '',
    save(text) { this.content = text; localStorage.setItem('socrat-notes', text); },
    load() { return this.content; },
};

function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

async function initMainPage() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    const input = document.getElementById('chat-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    initPage();
}

function addMessage(role, content) {
    const box = document.getElementById('chat-box');
    if (!box) return null;
    const wrap = document.createElement('div');
    wrap.className = `msg ${role === 'user' ? 'user' : 'ai'}`;
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `avatar-chat ${role === 'user' ? 'user-avatar' : 'ai-avatar'}`;
    if (role === 'user') {
        avatarDiv.textContent = currentUser ? (currentUser.name || 'П')[0].toUpperCase() : 'П';
    } else {
        avatarDiv.innerHTML = '<i class="fas fa-feather-pointed"></i>';
    }
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.textContent = content;
    wrap.appendChild(avatarDiv);
    wrap.appendChild(bubble);
    box.appendChild(wrap);
    scrollToBottom();
    return bubble;
}

function scrollToBottom() {
    const box = document.getElementById('chat-box');
    if (box) box.scrollTop = box.scrollHeight;
}

function addTypingIndicator() {
    const box = document.getElementById('chat-box');
    if (!box) return;
    const wrap = document.createElement('div');
    wrap.className = 'msg ai';
    wrap.id = 'typing-indicator';
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar-chat ai-avatar';
    avatarDiv.innerHTML = '<i class="fas fa-feather-pointed"></i>';
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
    wrap.appendChild(avatarDiv);
    wrap.appendChild(bubble);
    box.appendChild(wrap);
    scrollToBottom();
}

function removeTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function initPage() {
    const checkTheme = () => {
        const savedTheme = localStorage.getItem('socrat-theme') || 'light';
        applyTheme(savedTheme);
    };

    checkTheme();

    fetch('/me', { credentials: 'include' })
        .then(async res => {
            if (res.status === 401 || res.status === 403) {
                window.location.href = '/';
                return;
            }
            if (!res.ok) return;
            const data = await res.json();
            currentUser = data;
            const name = data.name || data.email || 'Пользователь';
            document.getElementById('sidebar-username').textContent = name;
            document.getElementById('user-avatar-letter').textContent = name[0].toUpperCase();
            // Sync footer
            document.getElementById('sidebar-username-footer').textContent = name;
            document.getElementById('user-avatar-letter-footer').textContent = name[0].toUpperCase();
            document.getElementById('current-session-item').style.display = 'block';
            const urlParams = new URLSearchParams(window.location.search);
            const urlSessionId = urlParams.get('session_id');
            if (urlSessionId) {
                currentSessionId = urlSessionId;
                loadSessionHistory(urlSessionId);
            } else {
                currentSessionId = generateSessionId();
            }
            loadPastSessions();
        })
        .catch(() => {
            document.getElementById('sidebar-username').textContent = 'Пользователь';
            document.getElementById('user-avatar-letter').textContent = 'П';
            // Sync footer
            document.getElementById('sidebar-username-footer').textContent = 'Пользователь';
            document.getElementById('user-avatar-letter-footer').textContent = 'П';
            document.getElementById('current-session-item').style.display = 'block';
        });

    document.getElementById('notes-textarea')?.addEventListener('input', (e) => {
        notesState.save(e.target.value);
    });
    document.getElementById('notes-textarea').value = notesState.load();
}

function sendMessage() {
    if (isStreaming) return;
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    if (!input || !sendBtn) return;
    const message = input.value.trim();
    if (!message) return;
    addMessage('user', message);
    chatHistory.push({ role: 'user', content: message });
    input.value = '';
    input.focus();
    isStreaming = true;
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    addTypingIndicator();
    fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        credentials: 'include',
        body: JSON.stringify({ message, history: chatHistory.slice(-10), emotion: moodState.get(), session_id: currentSessionId }),
    }).then(async response => {
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Ошибка сервера: ${response.status}`);
        }
        removeTypingIndicator();
        const data = await response.json();
        const aiText = data.reply || '';
        if (!aiText) throw new Error('Пустой ответ от сервера');
        addMessage('assistant', aiText);
        chatHistory.push({ role: 'assistant', content: aiText });
        if (data.session_title) {
            const titleEl = document.getElementById('current-lesson-name');
            if (titleEl && (titleEl.textContent === 'Новое занятие' || titleEl.textContent === '')) {
                titleEl.textContent = data.session_title;
            }
        }
    }).catch(err => {
        removeTypingIndicator();
        console.error('Chat error:', err);
        showToast('Ошибка: ' + err.message);
        if (chatHistory[chatHistory.length - 1]?.role === 'user') {
            chatHistory.pop();
        }
    }).finally(() => {
        isStreaming = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    });
}

function setMood(el) {
    document.querySelectorAll('.mood-emoji').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
    moodState.set(el.dataset.mood || 'neutral');
}

function newSession() {
    if (chatHistory.length > 0 && !confirm('Начать новое занятие? Текущая история очистится.')) return;
    chatHistory = [];
    currentSessionId = generateSessionId();
    const box = document.getElementById('chat-box');
    if (!box) return;
    box.innerHTML = `
        <div class="msg ai">
            <div class="avatar-chat ai-avatar"><i class="fas fa-feather-pointed"></i></div>
            <div class="msg-bubble">Новое занятие начато. Расскажи, с чем хочешь разобраться?</div>
        </div>
    `;
    const titleEl = document.getElementById('current-lesson-name');
    if (titleEl) titleEl.textContent = 'Новое занятие';
    document.getElementById('current-session-item').style.display = 'block';
    loadPastSessions();
}

async function loadSessionHistory(sessionId) {
    try {
        const res = await fetch(`/sessions/${sessionId}/messages`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const box = document.getElementById('chat-box');
        if (!box) return;
        box.innerHTML = '';
        chatHistory = [];
        if (data.title) {
            const titleEl = document.getElementById('current-lesson-name');
            if (titleEl) titleEl.textContent = data.title;
        }
        (data.messages || []).forEach(m => {
            addMessage(m.role, m.content);
            chatHistory.push({ role: m.role, content: m.content });
        });
    } catch (e) {
        console.error('loadSessionHistory error', e);
    }
}

async function loadPastSessions() {
    try {
        const res = await fetch('/sessions', { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const container = document.getElementById('past-sessions-list');
        if (!container) return;
        container.innerHTML = '';
        (data.sessions || []).forEach(s => {
            const wrap = document.createElement('div');
            wrap.className = 'nav-item-wrapper';
            const isActive = s.id === currentSessionId;
            wrap.innerHTML = `<button class="nav-btn${isActive ? ' active' : ''}" title="${s.title}" onclick="switchSession('${s.id}', this)">
                <i class="fas fa-book-open"></i>
                <span class="lesson-title-text">${s.title}</span>
            </button>`;
            container.appendChild(wrap);
        });
    } catch (e) { }
}

async function switchSession(sessionId, btn) {
    if (sessionId === currentSessionId) return;
    currentSessionId = sessionId;
    document.querySelectorAll('#past-sessions-list .nav-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const currentItem = document.getElementById('current-session-item');
    if (currentItem) currentItem.style.display = 'none';
    await loadSessionHistory(sessionId);
}

function toggleLessonMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('lesson-menu');
    if (!menu) return;
    const rect = e.currentTarget.getBoundingClientRect();
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.left = (rect.left - 100) + 'px';
}

window.addEventListener('click', () => {
    const lessonMenu = document.getElementById('lesson-menu');
    if (lessonMenu) lessonMenu.style.display = 'none';
});

function renameLesson() {
    const titleEl = document.getElementById('current-lesson-name');
    if (!titleEl) return;
    const newName = prompt('Новое название занятия:', titleEl.textContent);
    if (newName && newName.trim()) {
        titleEl.textContent = newName.trim();
    }
}

function deleteLesson() {
    if (confirm('Удалить текущее занятие?')) {
        newSession();
    }
}

let toolData = null;

async function openTool(type) {
    const overlay = document.getElementById('tool-overlay');
    const body = document.getElementById('overlay-body');
    const title = document.getElementById('overlay-title');
    if (!overlay || !body || !title) return;
    overlay.classList.add('active');
    const titles = { test: 'Тест', cards: 'Флеш-карточки', questions: 'Письменные вопросы', gaps: 'Заполни пропуски' };
    title.innerText = titles[type] || 'Задание';
    body.innerHTML = `<div style="text-align:center; padding:40px 0;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; color:var(--primary);"></i>
        <p style="margin-top:15px; color:var(--text-muted);">Сократ готовит задания по теме вашей беседы...</p>
    </div>`;
    try {
        const res = await fetch('/generate-tool', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
            credentials: 'include',
            body: JSON.stringify({ type, history: chatHistory }),
        });
        if (!res.ok) throw new Error('Ошибка сервера');
        const data = await res.json();
        toolData = { type, data };
        renderTool(type, data, body);
    } catch (err) {
        body.innerHTML = `<div style="text-align:center; padding:40px 0; color:#FF4757;">
            <i class="fas fa-exclamation-circle" style="font-size:2rem;"></i>
            <p style="margin-top:15px;">Не удалось загрузить задание. Убедитесь, что настроен API ключ.</p>
            <button class="send-btn" style="margin-top:20px; border-radius:12px; padding:10px 20px;" onclick="openTool('${type}')">Попробовать снова</button>
        </div>`;
    }
}

function renderTool(type, data, body) {
    if (!body) return;
    if (type === 'test' && data.questions) {
        let html = '';
        data.questions.forEach((q, qi) => {
            html += `<div style="margin-bottom:30px;">
                <p class="label-cap">Вопрос ${qi + 1} из ${data.questions.length}</p>
                <h3 style="margin-bottom:15px; font-size:1rem;">${q.question}</h3>`;
            q.options.forEach((opt, oi) => {
                html += `<div class="option-card" data-qi="${qi}" data-oi="${oi}" onclick="toggleOption(this)">${opt}</div>`;
            });
            html += `</div>`;
        });
        html += `<button class="send-btn" style="width:100%; margin-top:10px; border-radius:12px; height:44px;" onclick="checkTest()">Проверить</button>
                 <div id="test-result" style="margin-top:15px; font-weight:600;"></div>`;
        body.innerHTML = html;
    } else if (type === 'cards' && data.cards) {
        const cards = data.cards;
        let cardIdx = 0;
        const showCard = (i) => {
            const c = cards[i];
            body.innerHTML = `
                <p class="label-cap" style="text-align:center;">${i + 1} из ${cards.length}</p>
                <div class="flashcard-scene">
                    <div class="flashcard" id="fc" onclick="this.classList.toggle('is-flipped')">
                        <div class="flashcard-face flashcard-front">${c.front}</div>
                        <div class="flashcard-face flashcard-back">${c.back}</div>
                    </div>
                </div>
                <p style="text-align:center; color:var(--text-muted); font-size:0.85rem; margin-bottom:20px;">Нажми на карточку чтобы перевернуть</p>
                <div style="display:flex; gap:10px;">
                    <button id="btn-repeat" class="send-btn" style="flex:1; background:#FF6B6B; border-radius:12px; height:44px;">← Ещё раз</button>
                    <button id="btn-know" class="send-btn" style="flex:1; border-radius:12px; height:44px;">Знаю ✓</button>
                </div>`;
            document.getElementById('btn-repeat')?.addEventListener('click', () => {
                if (cardIdx < cards.length - 1) { cardIdx++; showCard(cardIdx); } else { cardIdx = 0; showCard(0); }
            });
            document.getElementById('btn-know')?.addEventListener('click', () => {
                if (cardIdx < cards.length - 1) { cardIdx++; showCard(cardIdx); } else { body.innerHTML = '<div style="text-align:center;padding:50px;font-size:1.3rem;">✅ Все карточки пройдены!</div>'; }
            });
        };
        showCard(0);
    } else if (type === 'questions' && data.questions) {
        let html = '';
        data.questions.forEach((q, qi) => {
            html += `<div class="input-question" style="margin-bottom:25px;">
                <p style="font-weight:600; margin-bottom:10px;">${qi + 1}. ${q.question}</p>
                <textarea class="custom-textarea" rows="4" placeholder="Введите ответ..." data-question="${q.question.replace(/"/g, '&quot;')}"></textarea>
                <button class="send-btn" style="width:100%; margin-top:10px; border-radius:12px; height:44px;" onclick="submitQuestion(this)">Проверить ответ</button>
                <div class="q-result-${qi}" style="margin-top:10px;"></div>
            </div>`;
        });
        body.innerHTML = html;
    } else if (type === 'gaps' && data.sentences) {
        let html = `<p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">Заполни пропуски правильными словами:</p><div class="gap-sentence" style="margin-bottom:30px;">`;
        data.sentences.forEach(s => {
            html += `${s.before} <input type="text" class="gap-input" data-answer="${s.answer.toLowerCase()}" placeholder="..."> ${s.after}<br><br>`;
        });
        html += `</div><button class="send-btn" style="width:100%; border-radius:12px; height:44px;" onclick="checkGaps()">Готово</button><div id="gaps-result" style="margin-top:15px; font-weight:600;"></div>`;
        body.innerHTML = html;
    } else {
        body.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:40px;">Не удалось отобразить задание.</p>';
    }
}

function closeTool() {
    document.getElementById('tool-overlay')?.classList.remove('active');
    toolData = null;
}

function toggleCurrentSession() {
    const item = document.getElementById('current-session-item');
    const btn = document.querySelector('button[onclick="toggleCurrentSession()"]');
    if (item.style.display === 'none') {
        item.style.display = 'block';
        btn.classList.add('active');
    } else {
        item.style.display = 'none';
        btn.classList.remove('active');
    }
}

function togglePastSessions() {
    const list = document.getElementById('past-sessions-list');
    const btn = document.querySelector('button[onclick="togglePastSessions()"]');
    if (list.style.display === 'none') {
        list.style.display = 'block';
        btn.classList.add('active');
    } else {
        list.style.display = 'none';
        btn.classList.remove('active');
    }
}

function openLibrary() {
    document.getElementById('library-overlay')?.classList.add('active');
}

function closeLibrary() {
    document.getElementById('library-overlay')?.classList.remove('active');
}

function toggleOption(el) {
    const qi = el.dataset.qi;
    document.querySelectorAll(`.option-card[data-qi="${qi}"]`).forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
}

function checkTest() {
    if (!toolData || !toolData.data.questions) return;
    const questions = toolData.data.questions;
    let correct = 0;
    let html = '';
    for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        const selected = document.querySelector(`.option-card[data-qi="${qi}"].selected`);
        if (!selected) { showToast('Ответь на все вопросы', 'warning'); return; }
        const chosenIdx = parseInt(selected.dataset.oi, 10);
        const isCorrect = chosenIdx === q.correct;
        if (isCorrect) correct++;
        html += `<div style="margin-bottom:10px; padding:10px; border-radius:10px; background:${isCorrect ? 'rgba(80,200,120,0.1)' : 'rgba(255,71,87,0.1)'};">
            ${isCorrect ? '✅' : '❌'} <b>Вопрос ${qi+1}:</b> ${isCorrect ? 'Верно' : 'Неверно — правильный ответ: ' + q.options[q.correct]}
        </div>`;
    }
    const result = document.getElementById('test-result');
    if (result) {
        result.innerHTML = `<div style="margin-bottom:15px; font-size:1.1rem;">${correct === questions.length ? '🎉 Отлично!' : `Правильно ${correct} из ${questions.length}`}</div>${html}`;
        result.style.color = correct === questions.length ? 'var(--primary)' : '#FF4757';
    }
}

async function submitQuestion(btn) {
    const container = btn.previousElementSibling;
    const question = container?.dataset.question || '';
    const answer = container?.value.trim();
    if (!answer) { showToast('Напиши ответ перед отправкой', 'error'); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    const resultEl = btn.nextElementSibling;
    try {
        const res = await fetch('/check-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
            credentials: 'include',
            body: JSON.stringify({ question, answer }),
        });
        const data = await res.json();
        if (resultEl) {
            resultEl.innerHTML = `<div style="padding:12px; border-radius:10px; background:${data.correct ? 'rgba(80,200,120,0.1)' : 'rgba(255,71,87,0.1)'}; border-left:3px solid ${data.correct ? 'var(--primary)' : '#FF4757'};">
                <p style="font-weight:700; color:${data.correct ? 'var(--primary)' : '#FF4757'}; margin-bottom:6px;">${data.correct ? '✅ Хороший ответ!' : '❌ Есть неточности'}</p>
                <p style="font-size:0.9rem; color:var(--text-muted);">${data.feedback}</p>
            </div>`;
        }
    } catch (e) {
        if (resultEl) resultEl.textContent = 'Ошибка проверки';
    }
    btn.disabled = false;
    btn.innerHTML = 'Проверить ответ';
}

function checkGaps() {
    const inputs = document.querySelectorAll('.gap-input');
    if (!inputs.length) return;
    let correct = 0;
    inputs.forEach(input => {
        const answer = input.dataset.answer || '';
        if (input.value.trim().toLowerCase() === answer) correct++;
        input.style.borderColor = input.value.trim().toLowerCase() === answer ? 'var(--primary)' : '#FF4757';
    });
    const result = document.getElementById('gaps-result');
    if (result) {
        result.textContent = `Правильно ${correct} из ${inputs.length}`;
        result.style.color = correct === inputs.length ? 'var(--primary)' : '#FF4757';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const pageClass = document.body.classList;
    if (pageClass.contains('page-index')) initIndexPage();
    if (pageClass.contains('page-dashboard')) initDashboardPage();
    if (pageClass.contains('page-main')) initMainPage();
});

AOS.init({ duration: 1000, once: true });

const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = themeToggle.querySelector('i');
const savedTheme = localStorage.getItem('socrat-theme') || 'light';
html.setAttribute('data-theme', savedTheme);
updateThemeIcon(savedTheme);

themeToggle.addEventListener('click', () => {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('socrat-theme', next);
    updateThemeIcon(next);
});
function updateThemeIcon(t) {
    themeIcon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

const savedLang = localStorage.getItem('socrat-lang') || 'ru';
setLang(savedLang, false);

function setLang(lang, save = true) {
    html.setAttribute('data-lang', lang);
    if (save) localStorage.setItem('socrat-lang', lang);
    const btnRu = document.getElementById('btn-ru');
    const btnKz = document.getElementById('btn-kz');
    if (btnRu) btnRu.classList.toggle('active', lang === 'ru');
    if (btnKz) btnKz.classList.toggle('active', lang === 'kz');
    html.lang = lang === 'kz' ? 'kk' : 'ru';
}

window.addEventListener('scroll', () => {
    document.getElementById('floating-navbar').classList.toggle('navbar-scrolled', window.scrollY > 50);
});

document.querySelectorAll('.faq-header-faq-header').forEach(h => {
    h.addEventListener('click', () => h.parentElement.classList.toggle('faq-item-active-faq-item-active'));
});

function openModal(tab) {
    document.getElementById('auth-modal').classList.add('open');
    switchTab(tab || 'login');
    document.body.style.overflow = 'hidden';
}
function closeModal() {
    document.getElementById('auth-modal').classList.remove('open');
    document.body.style.overflow = '';
}
function switchTab(tab) {
    document.querySelectorAll('.modal-tab').forEach((b, i) => b.classList.toggle('active', (i === 0) === (tab === 'login')));
    document.getElementById('tab-login').classList.toggle('active', tab === 'login');
    document.getElementById('tab-register').classList.toggle('active', tab === 'register');
}
document.getElementById('auth-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

const bgCanvas = document.getElementById('bg-neural-canvas');
function initNeuralBG() {
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
initNeuralBG();

const aiVisualCore = document.getElementById('ai-visual-core');
document.addEventListener('mousemove', e => {
    const x = (window.innerWidth / 2 - e.pageX) / 40;
    const y = (window.innerHeight / 2 - e.pageY) / 40;
    aiVisualCore.style.transform = `rotateY(${x}deg) rotateX(${y + 10}deg)`;
});

function animateCount(el, target, duration = 1500) {
    const start = performance.now();
    const update = time => {
        const p = Math.min((time - start) / duration, 1);
        el.textContent = Math.round(p * target);
        if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
}
const statObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.querySelectorAll('.stat-num').forEach(el => {
                const v = parseInt(el.textContent);
                if (v > 0) animateCount(el, v);
            });
            statObserver.disconnect();
        }
    });
}, { threshold: 0.5 });
const strip = document.querySelector('.stat-strip');
if (strip) statObserver.observe(strip);

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

function showAuthError(msg) {
    let el = document.getElementById('auth-error');
    if (!el) {
        el = document.createElement('div');
        el.id = 'auth-error';
        el.style.cssText = 'background:#ff4757;color:white;padding:10px 16px;border-radius:12px;margin-bottom:12px;font-size:0.88rem;font-weight:600;';
        const loginSection = document.getElementById('tab-login');
        loginSection.prepend(el);
    }
    el.textContent = msg;
    el.style.display = 'block';
}

function hideAuthError() {
    const el = document.getElementById('auth-error');
    if (el) el.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    // Логин
    const loginBtn = document.querySelector('#tab-login .btn-primary-elite');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            hideAuthError();
            const email    = document.querySelector('#tab-login input[type="email"]').value.trim();
            const password = document.querySelector('#tab-login input[type="password"]').value;

            if (!email || !password) { showAuthError('Заполните все поля'); return; }

            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const res  = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken(),
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
                });
                let data = {};
                try { data = await res.json(); } catch (_) { data = {}; }

                if (res.ok && data.success) {
                    window.location.href = data.redirect;
                } else {
                    showAuthError(data.error || 'Ошибка входа');
                    loginBtn.disabled = false;
                    loginBtn.innerHTML = '<span data-lang-ru>Войти</span>';
                }
            } catch(e) {
                showAuthError(e?.message || 'Ошибка сети');
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span data-lang-ru>Войти</span>';
            }
        });
    }

    // Регистрация
    const regBtn = document.querySelector('#tab-register .btn-primary-elite');
    if (regBtn) {
        regBtn.addEventListener('click', async () => {
            hideAuthError();
            const name     = document.querySelector('#tab-register input[type="text"]').value.trim();
            const email    = document.querySelector('#tab-register input[type="email"]').value.trim();
            const password = document.querySelector('#tab-register input[type="password"]').value;

            if (!name || !email || !password) { showAuthError('Заполните все поля'); return; }
            if (password.length < 6) { showAuthError('Пароль минимум 6 символов'); return; }

            regBtn.disabled = true;
            regBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

            try {
                const res  = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCsrfToken(),
                    },
                    credentials: 'include',
                    body: JSON.stringify({ name, email, password })
                });
                let data = {};
                try { data = await res.json(); } catch (_) { data = {}; }

                if (res.ok && data.success) {
                    window.location.href = data.redirect;
                } else {
                    showAuthError(data.error || 'Ошибка регистрации');
                    regBtn.disabled = false;
                    regBtn.innerHTML = '<span data-lang-ru>Зарегистрироваться</span>';
                }
            } catch(e) {
                showAuthError(e?.message || 'Ошибка сети');
                regBtn.disabled = false;
                regBtn.innerHTML = '<span data-lang-ru>Зарегистрироваться</span>';
            }
        });
    }
});

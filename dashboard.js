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

function showToast(msg, color = '#FF4757') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.style.background = color;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function scrollToBottom() {
    const box = document.getElementById('chat-box');
    box.scrollTop = box.scrollHeight;
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

async function initPage() {
    try {
        const res = await fetch('/me', { credentials: 'include' });
        if (res.status === 401 || res.status === 403) {
            window.location.href = '/';
            return;
        }
        if (res.ok) {
            const data = await res.json();
            currentUser = data;
            const name = data.name || data.email || 'Пользователь';
            document.getElementById('sidebar-username').textContent = name;
            document.getElementById('user-avatar-letter').textContent = name[0].toUpperCase();
            document.getElementById('current-session-item').style.display = 'block';

            const urlParams = new URLSearchParams(window.location.search);
            const urlSessionId = urlParams.get('session_id');
            if (urlSessionId) {
                currentSessionId = urlSessionId;
                await loadSessionHistory(urlSessionId);
            } else {
                currentSessionId = generateSessionId();
            }
            loadPastSessions();
        }
    } catch (e) {
        document.getElementById('sidebar-username').textContent = 'Пользователь';
        document.getElementById('user-avatar-letter').textContent = 'П';
        document.getElementById('current-session-item').style.display = 'block';
    }

    const savedTheme = localStorage.getItem('socrat-theme') || 'light';
    applyTheme(savedTheme);

    document.getElementById('notes-textarea').value = notesState.load();
    document.getElementById('notes-textarea').addEventListener('input', (e) => {
        notesState.save(e.target.value);
    });
}

function addMessage(role, content) {
    const box = document.getElementById('chat-box');
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

function addTypingIndicator() {
    const box = document.getElementById('chat-box');
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

async function sendMessage() {
    if (isStreaming) return;

    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
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

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
            credentials: 'include',
            body: JSON.stringify({
                message: message,
                history: chatHistory.slice(-10),
                emotion: moodState.get(),
                session_id: currentSessionId,
            }),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `Ошибка сервера: ${response.status}`);
        }

        removeTypingIndicator();
        const data = await response.json();
        const aiText = data.reply || '';
        if (!aiText) {
            throw new Error('Пустой ответ от сервера');
        }
        addMessage('assistant', aiText);
        chatHistory.push({ role: 'assistant', content: aiText });

        if (data.session_title) {
            const titleEl = document.getElementById('current-lesson-name');
            if (titleEl && (titleEl.textContent === 'Новое занятие' || titleEl.textContent === '')) {
                titleEl.textContent = data.session_title;
            }
        }

    } catch (err) {
        removeTypingIndicator();
        console.error('Chat error:', err);
        showToast('Ошибка: ' + err.message);
        if (chatHistory[chatHistory.length - 1]?.role === 'user') {
            chatHistory.pop();
        }
    } finally {
        isStreaming = false;
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('chat-input');
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    initPage();
});

function applyTheme(theme) {
    document.getElementById('app').setAttribute('data-theme', theme);
    const icon = document.getElementById('theme-icon');
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
    const app = document.getElementById('app');
    const isDark = app.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    applyTheme(newTheme);
    localStorage.setItem('socrat-theme', newTheme);
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
    box.innerHTML = `
        <div class="msg ai">
            <div class="avatar-chat ai-avatar"><i class="fas fa-feather-pointed"></i></div>
            <div class="msg-bubble">Новое занятие начато. Расскажи, с чем хочешь разобраться?</div>
        </div>
    `;
    document.getElementById('current-lesson-name').textContent = 'Новое занятие';
    document.getElementById('current-session-item').style.display = 'block';
    loadPastSessions();
}

async function loadSessionHistory(sessionId) {
    try {
        const res = await fetch(`/sessions/${sessionId}/messages`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        const box = document.getElementById('chat-box');
        box.innerHTML = '';
        chatHistory = [];

        if (data.title) {
            document.getElementById('current-lesson-name').textContent = data.title;
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
    btn.classList.add('active');
    document.getElementById('current-session-item').style.display = 'none';
    await loadSessionHistory(sessionId);
}

function toggleLessonMenu(e) {
    e.stopPropagation();
    const menu = document.getElementById('lesson-menu');
    const rect = e.currentTarget.getBoundingClientRect();
    menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    menu.style.top = (rect.bottom + 5) + 'px';
    menu.style.left = (rect.left - 100) + 'px';
}

window.addEventListener('click', () => {
    document.getElementById('lesson-menu').style.display = 'none';
});

function renameLesson() {
    const newName = prompt('Новое название занятия:', document.getElementById('current-lesson-name').textContent);
    if (newName && newName.trim()) {
        document.getElementById('current-lesson-name').textContent = newName.trim();
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

        function showCard(i) {
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
            document.getElementById('btn-repeat').addEventListener('click', () => {
                if (cardIdx < cards.length - 1) { cardIdx++; showCard(cardIdx); }
                else { cardIdx = 0; showCard(0); }
            });
            document.getElementById('btn-know').addEventListener('click', () => {
                if (cardIdx < cards.length - 1) { cardIdx++; showCard(cardIdx); }
                else { body.innerHTML = '<div style="text-align:center;padding:50px;font-size:1.3rem;">✅ Все карточки пройдены!</div>'; }
            });
        }
        showCard(0);

    } else if (type === 'questions' && data.questions) {
        let html = '';
        data.questions.forEach((q, qi) => {
            html += `<div class="input-question" style="margin-bottom:25px;">
                <p style="font-weight:600; margin-bottom:10px;">${qi + 1}. ${q.question}</p>
                <textarea class="custom-textarea" rows="4" placeholder="Введите ответ..." data-question="${q.question.replace(/"/g,'&quot;')}"></textarea>
                <button class="send-btn" style="width:100%; margin-top:10px; border-radius:12px; height:44px;" onclick="submitQuestion(this)">Проверить ответ</button>
                <div class="q-result-${qi}" style="margin-top:10px;"></div>
            </div>`;
        });
        body.innerHTML = html;

    } else if (type === 'gaps' && data.sentences) {
        let html = `<p style="color:var(--text-muted); margin-bottom:20px; font-size:0.9rem;">Заполни пропуски правильными словами:</p>
                    <div class="gap-sentence" style="margin-bottom:30px;">`;
        data.sentences.forEach(s => {
            html += `${s.before} <input type="text" class="gap-input" data-answer="${s.answer.toLowerCase()}" placeholder="..."> ${s.after}<br><br>`;
        });
        html += `</div>
                 <button class="send-btn" style="width:100%; border-radius:12px; height:44px;" onclick="checkGaps()">Готово</button>
                 <div id="gaps-result" style="margin-top:15px; font-weight:600;"></div>`;
        body.innerHTML = html;
    } else {
        body.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:40px;">Не удалось отобразить задание.</p>';
    }
}

function closeTool() {
    document.getElementById('tool-overlay').classList.remove('active');
    toolData = null;
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
    questions.forEach((q, qi) => {
        const selected = document.querySelector(`.option-card[data-qi="${qi}"].selected`);
        if (!selected) { showToast('Ответь на все вопросы'); return; }
        const chosenIdx = parseInt(selected.dataset.oi);
        const isCorrect = chosenIdx === q.correct;
        if (isCorrect) correct++;
        html += `<div style="margin-bottom:10px; padding:10px; border-radius:10px; background:${isCorrect ? 'rgba(80,200,120,0.1)' : 'rgba(255,71,87,0.1)'};">
            ${isCorrect ? '✅' : '❌'} <b>Вопрос ${qi+1}:</b> ${isCorrect ? 'Верно' : 'Неверно — правильный ответ: ' + q.options[q.correct]}
        </div>`;
    });
    const result = document.getElementById('test-result');
    result.innerHTML = `<div style="margin-bottom:15px; font-size:1.1rem;">${correct === questions.length ? '🎉 Отлично!' : `Правильно ${correct} из ${questions.length}`}</div>${html}`;
    result.style.color = correct === questions.length ? 'var(--primary)' : '#FF4757';
}

async function submitQuestion(btn) {
    const container = btn.previousElementSibling;
    const question = container.dataset.question || '';
    const answer = container.value.trim();
    if (!answer) { showToast('Напиши ответ перед отправкой'); return; }

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
        resultEl.innerHTML = `<div style="padding:12px; border-radius:10px; background:${data.correct ? 'rgba(80,200,120,0.1)' : 'rgba(255,71,87,0.1)'}; border-left:3px solid ${data.correct ? 'var(--primary)' : '#FF4757'};">
            <p style="font-weight:700; color:${data.correct ? 'var(--primary)' : '#FF4757'}; margin-bottom:6px;">${data.correct ? '✅ Хороший ответ!' : '❌ Есть неточности'}</p>
            <p style="font-size:0.9rem; color:var(--text-muted);">${data.feedback}</p>
        </div>`;
    } catch (e) {
        resultEl.textContent = 'Ошибка проверки';
    }
    btn.disabled = false;
    btn.innerHTML = 'Проверить ответ';
}

function checkGaps() {
    const inputs = document.querySelectorAll('.gap-input');
    let correct = 0;
    inputs.forEach(inp => {
        const userAns = inp.value.trim().toLowerCase();
        const correctAns = inp.dataset.answer;
        if (userAns === correctAns || userAns.includes(correctAns) || correctAns.includes(userAns)) {
            inp.style.borderColor = 'var(--primary)';
            correct++;
        } else {
            inp.style.borderColor = '#FF4757';
        }
    });
    const result = document.getElementById('gaps-result');
    result.textContent = correct === inputs.length
        ? `✅ Отлично! Все пропуски заполнены верно.`
        : `Правильно ${correct} из ${inputs.length}. Попробуй ещё раз!`;
    result.style.color = correct === inputs.length ? 'var(--primary)' : '#FF4757';
}

async function openLibraryOverlay() {
    document.getElementById('library-overlay').classList.add('active');
    await renderLibraryItems();
}

function closeLibraryOverlay() {
    document.getElementById('library-overlay').classList.remove('active');
}

async function renderLibraryItems() {
    const list = document.getElementById('library-items-list');
    list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:20px;"><i class="fas fa-circle-notch fa-spin"></i> Загрузка...</p>';
    try {
        const res = await fetch('/library', { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await res.json();
        const items = data.items || [];
        if (items.length === 0) {
            list.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:30px;">Библиотека пуста. Добавьте первый материал!</p>';
            return;
        }
        const icons = { course: 'fa-graduation-cap', note: 'fa-sticky-note', link: 'fa-link', file: 'fa-file' };
        list.innerHTML = items.map(item => `
            <div style="background:var(--bg-body); padding:15px; border-radius:12px; margin-bottom:12px; display:flex; align-items:flex-start; gap:12px;">
                <div style="width:40px; height:40px; background:var(--primary); border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                    <i class="fas ${icons[item.item_type] || 'fa-book'}" style="color:white;"></i>
                </div>
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:700; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                    <div style="font-size:0.85rem; color:var(--text-muted);">${item.description || ''}</div>
                    ${item.file_url ? `<a href="${item.file_url}" target="_blank" style="font-size:0.8rem; color:var(--primary); font-weight:700;"><i class="fas fa-download"></i> ${item.file_name}</a>` : ''}
                    <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">${item.created_at}</div>
                </div>
                <button onclick="deleteLibraryItem(${item.id}, this)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; padding:5px;" title="Удалить">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `).join('');
    } catch (e) {
        list.innerHTML = '<p style="color:#FF4757; text-align:center; padding:20px;">Ошибка загрузки</p>';
    }
}

function showAddLibraryForm() {
    const list = document.getElementById('library-items-list');
    const formHtml = `
        <div id="add-lib-form" style="background:var(--bg-body); padding:20px; border-radius:15px; margin-bottom:20px; border:2px dashed var(--primary);">
            <h3 style="margin-bottom:15px; font-size:1rem;">Новый материал</h3>
            <input id="lib-title" type="text" placeholder="Название" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd; background:var(--card-bg); color:var(--text-main); font-family:inherit; margin-bottom:10px; outline:none;">
            <textarea id="lib-desc" placeholder="Описание (необязательно)" rows="2" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd; background:var(--card-bg); color:var(--text-main); font-family:inherit; margin-bottom:10px; outline:none; resize:none;"></textarea>
            <select id="lib-type" onchange="onDashLibTypeChange()" style="width:100%; padding:10px; border-radius:10px; border:1px solid #ddd; background:var(--card-bg); color:var(--text-main); font-family:inherit; margin-bottom:10px;">
                <option value="note">Заметка</option>
                <option value="course">Курс</option>
                <option value="link">Ссылка</option>
                <option value="file">Файл</option>
            </select>
            <div id="dash-file-group" style="display:none; margin-bottom:15px;">
                <input id="lib-file" type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg" style="width:100%; padding:8px; border-radius:10px; border:1px solid #ddd; background:var(--card-bg); color:var(--text-main); font-family:inherit;">
            </div>
            <div style="display:flex; gap:10px; margin-top:5px;">
                <button class="send-btn" style="flex:1; border-radius:10px; height:40px;" onclick="saveLibraryItem()">Сохранить</button>
                <button class="send-btn" style="flex:1; border-radius:10px; height:40px; background:#6c757d;" onclick="document.getElementById('add-lib-form').remove()">Отмена</button>
            </div>
        </div>
    `;
    list.insertAdjacentHTML('afterbegin', formHtml);
    document.getElementById('lib-title').focus();
}

function onDashLibTypeChange() {
    const type = document.getElementById('lib-type').value;
    const fg = document.getElementById('dash-file-group');
    if (fg) fg.style.display = type === 'file' ? 'block' : 'none';
}

async function saveLibraryItem() {
    const title = document.getElementById('lib-title').value.trim();
    if (!title) { showToast('Введите название', '#FF4757'); return; }
    const desc = document.getElementById('lib-desc').value.trim();
    const item_type = document.getElementById('lib-type').value;
    const fileInput = document.getElementById('lib-file');
    const file = fileInput && fileInput.files[0];
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
                headers: { 'X-CSRFToken': getCsrfToken() },
                credentials: 'include',
                body: fd,
            });
        } else {
            res = await fetch('/library', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
                credentials: 'include',
                body: JSON.stringify({ title, description: desc, item_type }),
            });
        }
        if (!res.ok) throw new Error();
        document.getElementById('add-lib-form').remove();
        await renderLibraryItems();
        showToast('Материал добавлен', '#50C878');
    } catch (e) {
        showToast('Ошибка сохранения', '#FF4757');
    }
}

async function deleteLibraryItem(id, btn) {
    if (!confirm('Удалить материал?')) return;
    try {
        await fetch(`/library/${id}`, {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCsrfToken() },
            credentials: 'include',
        });
        await renderLibraryItems();
    } catch (e) {
        showToast('Ошибка удаления', '#FF4757');
    }
}

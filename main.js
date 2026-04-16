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

            document.getElementById('topbar-username').textContent = name;
            document.getElementById('topbar-avatar').textContent = letter;
            document.getElementById('welcome-heading').textContent = `С возвращением, ${name}! ✨`;

            document.getElementById('settings-avatar').childNodes[0].textContent = letter;
            document.getElementById('settings-name-display').textContent = name;
            document.getElementById('settings-email-display').textContent = data.email || '';
            document.getElementById('settings-name').value = name;
            document.getElementById('settings-email').value = data.email || '';
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

            const startCard = grid.querySelector('.card');
            grid.innerHTML = '';
            grid.appendChild(startCard);

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
        const name = document.getElementById('settings-name').value.trim();
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

        if (pageId === 'stats')   setTimeout(() => this.renderChart(), 300);
        if (pageId === 'library') this.loadLibrary();
    }

    async loadLibrary() {
        const grid = document.getElementById('library-grid');
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
        document.getElementById('library-modal').classList.add('active');
        document.getElementById('lib-title').value = '';
        document.getElementById('lib-desc').value = '';
        document.getElementById('lib-type').value = 'note';
        document.getElementById('lib-file-group').style.display = 'none';
        document.getElementById('lib-file').value = '';
    }

    onLibTypeChange() {
        const type = document.getElementById('lib-type').value;
        document.getElementById('lib-file-group').style.display = type === 'file' ? 'block' : 'none';
    }

    closeLibraryModal() {
        document.getElementById('library-modal').classList.remove('active');
    }

    async saveLibraryItem() {
        const title = document.getElementById('lib-title').value.trim();
        if (!title) { this.showToast('Введите название', 'error'); return; }
        const desc      = document.getElementById('lib-desc').value.trim();
        const item_type = document.getElementById('lib-type').value;
        const fileInput = document.getElementById('lib-file');
        const file      = fileInput.files[0];
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
        document.getElementById('theme-toggle').checked = (savedTheme === 'dark');
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        document.getElementById('app').setAttribute('data-theme', newTheme);
        localStorage.setItem('socrat-theme', newTheme);
        this.renderChart();
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
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';

        let icon  = 'fa-info-circle';
        let color = 'var(--primary)';
        if (type === 'success') { icon = 'fa-check-circle';       color = 'var(--primary)'; }
        if (type === 'error')   { icon = 'fa-exclamation-circle'; color = 'var(--danger)';  }
        if (type === 'warning') { icon = 'fa-exclamation-triangle'; color = 'var(--warning)'; }

        toast.style.borderLeftColor = color;
        toast.innerHTML = `<i class="fas ${icon}" style="color: ${color}"></i> <span>${message}</span>`;

        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    initRipple() {
        document.querySelectorAll('.ripple-btn, .nav-link').forEach(btn => {
            btn.addEventListener('click', function (e) {
                const rect = this.getBoundingClientRect();
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                ripple.style.left   = `${e.clientX - rect.left}px`;
                ripple.style.top    = `${e.clientY - rect.top}px`;
                ripple.style.width  = ripple.style.height = `${Math.max(rect.width, rect.height)}px`;
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }

    animateXpRing() {
        setTimeout(() => {
            const ring = document.getElementById('xp-ring');
            const percent = 65;
            const circumference = 2 * Math.PI * 28;
            ring.style.strokeDashoffset = circumference - (percent / 100) * circumference;
        }, 500);
    }

    renderKanban() {
        const columns = { backlog: [], sprint: [], done: [] };
        this.tasks.forEach(t => columns[t.status].push(t));

        ['backlog', 'sprint', 'done'].forEach(status => {
            const container = document.getElementById(`list-${status}`);
            document.getElementById(`count-${status}`).innerText = columns[status].length;
            container.innerHTML = '';

            columns[status].forEach(task => {
                const el = document.createElement('div');
                el.className = 'task-card';
                el.draggable = true;
                el.id = task.id;

                let tagClass = 'tag-study', tagName = 'Обучение';
                if (task.tag === 'urgent')  { tagClass = 'tag-urgent';  tagName = 'Срочно';  }
                if (task.tag === 'project') { tagClass = 'tag-project'; tagName = 'Проект';  }

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
        } catch (e) { /* удаляем из UI даже при ошибке */ }
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.renderKanban();
        this.showToast('Задача удалена', 'info');
    }

    openTaskModal() {
        document.getElementById('task-modal').classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
        document.getElementById('new-task-title').value = '';
        document.getElementById('new-task-desc').value  = '';
        document.getElementById('new-task-date').value  = '';
    }

    async createTask() {
        const title = document.getElementById('new-task-title').value.trim();
        const desc  = document.getElementById('new-task-desc').value.trim();
        const tag   = document.getElementById('new-task-tag').value;
        const date  = document.getElementById('new-task-date').value;

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
        container.innerHTML = '';

        const width   = container.clientWidth;
        const height  = container.clientHeight;
        const padding = 40;
        const data    = this.chartData;
        const maxVal  = Math.max(...data) * 1.2;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        const isDark    = document.documentElement.getAttribute('data-theme') === 'dark';
        const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
        const textColor = isDark ? '#7A8580' : '#8E9894';

        const defs     = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
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

        const days   = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        const points = data.map((val, i) => ({
            x:   padding + (width - 2 * padding) * (i / (data.length - 1)),
            y:   height - padding - ((val / maxVal) * (height - 2 * padding)),
            val, day: days[i],
        }));

        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 2;
            const cp2x = points[i].x     - (points[i].x - points[i - 1].x) / 2;
            pathD += ` C ${cp1x} ${points[i - 1].y}, ${cp2x} ${points[i].y}, ${points[i].x} ${points[i].y}`;
        }

        const areaD    = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
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
                tooltip.textContent   = `${p.day}: ${p.val} очков`;
                tooltip.style.opacity = '1';
                tooltip.style.left    = `${p.x}px`;
                tooltip.style.top     = `${p.y - 40}px`;
            });
            circle.addEventListener('mouseleave', () => {
                circle.style.transform = 'scale(1)';
                circle.setAttribute('fill', 'var(--card-bg)');
                tooltip.style.opacity = '0';
            });

            svg.appendChild(circle);
        });

        container.appendChild(svg);
    }

    renderHeatmap() {
        const container = document.getElementById('heatmap-container');
        container.innerHTML = '';
        for (let i = 0; i < 42; i++) {
            const rect = document.createElement('div');
            rect.style.width = '100%';
            rect.style.paddingBottom = '100%';
            rect.style.borderRadius = '4px';

            const val = Math.random();
            if      (val > 0.8) rect.style.background = 'var(--primary-dark)';
            else if (val > 0.5) rect.style.background = 'var(--primary)';
            else if (val > 0.2) rect.style.background = 'var(--primary-light)';
            else                rect.style.background = 'var(--bg-body)';

            rect.style.opacity   = '0';
            rect.style.animation = `scaleIn 0.3s forwards ${i * 0.02}s`;
            container.appendChild(rect);
        }
    }
}

const app = new SocratApp();

window.addEventListener('resize', () => {
    if (document.getElementById('stats').classList.contains('active')) {
        app.renderChart();
    }
});

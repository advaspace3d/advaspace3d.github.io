// ====== АДМИН-ПАНЕЛЬ v2.2.0 ======
// Двусторонняя синхронизация: админка ↔ GitHub ↔ витрина

// ====== СОСТОЯНИЕ ======
const state = {
    products: [],
    slides: [],
    currentTab: 'models',
    isUploading: false,
    editingId: null,
    editingType: null,
    lastSync: null
};

// ====== DOM-ССЫЛКИ ======
const $ = id => document.getElementById(id);
const qs = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ====== ТОСТЫ ======
function toast(msg, type = 'info') {
    const container = $('toasts');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateX(100px)';
        setTimeout(() => el.remove(), 300);
    }, 3500);
}

// ====== UTF-8 → BASE64 ======
function utf8ToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
}

// ====== ПРОВЕРКА КОНФИГА ======
function checkConfig() {
    if (typeof GITHUB_CONFIG === 'undefined') {
        toast('❌ config.js не загружен!', 'error');
        return false;
    }
    if (!GITHUB_CONFIG.token || GITHUB_CONFIG.token === 'ghp_ВАШ_ТОКЕН_ЗДЕСЬ') {
        toast('❌ Вставьте GitHub токен в config.js!', 'error');
        return false;
    }
    return true;
}

// ============================================================
// ====== ЗАГРУЗКА С GITHUB (АДМИНКА ← GITHUB) ======
// ============================================================

async function loadFromGitHub() {
    toast('🔄 Загрузка данных с GitHub...', 'info');
    
    let productsLoaded = false;
    let slidesLoaded = false;
    
    // Загружаем товары
    try {
        const res = await fetch('data.json?t=' + Date.now());
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                state.products = data;
                localStorage.setItem('3dshop_products', JSON.stringify(data));
                productsLoaded = true;
                console.log(`✅ Загружено ${data.length} товаров с GitHub`);
            }
        }
    } catch (e) {
        console.warn('⚠️ Ошибка загрузки data.json:', e.message);
    }
    
    if (!productsLoaded) {
        const saved = localStorage.getItem('3dshop_products');
        if (saved) {
            try {
                state.products = JSON.parse(saved);
                productsLoaded = true;
                console.log(`✅ Загружено ${state.products.length} товаров из localStorage (кеш)`);
            } catch (e) {}
        }
    }
    
    if (!productsLoaded || !state.products.length) {
        state.products = [];
        toast('⚠️ Не удалось загрузить товары с GitHub', 'error');
    }
    
    // Загружаем слайды
    try {
        const res = await fetch('slides.json?t=' + Date.now());
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
                state.slides = data;
                localStorage.setItem('3dshop_slides', JSON.stringify(data));
                slidesLoaded = true;
                console.log(`✅ Загружено ${data.length} слайдов с GitHub`);
            }
        }
    } catch (e) {
        console.warn('⚠️ Ошибка загрузки slides.json:', e.message);
    }
    
    if (!slidesLoaded) {
        const saved = localStorage.getItem('3dshop_slides');
        if (saved) {
            try {
                state.slides = JSON.parse(saved);
                slidesLoaded = true;
                console.log(`✅ Загружено ${state.slides.length} слайдов из localStorage (кеш)`);
            } catch (e) {}
        }
    }
    
    if (!slidesLoaded || !state.slides.length) {
        state.slides = [];
    }
    
    state.lastSync = new Date().toLocaleString();
    updateSyncStatus();
    console.log(`🔄 Синхронизация завершена: ${state.products.length} товаров, ${state.slides.length} слайдов`);
}

function saveToLocalStorage() {
    localStorage.setItem('3dshop_products', JSON.stringify(state.products));
    localStorage.setItem('3dshop_slides', JSON.stringify(state.slides));
}

// ============================================================
// ====== ОТПРАВКА НА GITHUB (АДМИНКА → GITHUB) ======
// ============================================================

async function uploadImage(file, category) {
    const { token, owner, repo, branch, path } = GITHUB_CONFIG;
    
    const base64 = await new Promise(resolve => {
        const r = new FileReader();
        r.onload = e => resolve(e.target.result.split(',')[1]);
        r.readAsDataURL(file);
    });
    
    const ts = Date.now();
    const ext = file.name.split('.').pop();
    const fname = `${ts}.${ext}`;
    const fullPath = `${path}/${category}/${fname}`;
    
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fullPath}`;
    const res = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: `Добавлено: ${fname}`,
            content: base64,
            branch: branch
        })
    });
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(`GitHub: ${err.message || 'Ошибка'}`);
    }
    
    const data = await res.json();
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${fullPath}`;
}

async function pushToGitHub(fileName, data, commitMsg) {
    const { token, owner, repo, branch } = GITHUB_CONFIG;
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;
    
    let res = await fetch(url, {
        headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
    });
    
    let sha = null;
    let existing = [];
    
    if (res.ok) {
        const fileData = await res.json();
        sha = fileData.sha;
        try {
            const content = atob(fileData.content);
            existing = JSON.parse(content);
            if (!Array.isArray(existing)) existing = [];
        } catch (e) { existing = []; }
    }
    
    // Объединяем: обновляем существующие, добавляем новые
    const newData = [...existing];
    for (const item of data) {
        const idx = newData.findIndex(i => i.id === item.id);
        if (idx >= 0) newData[idx] = item;
        else newData.push(item);
    }
    
    const json = JSON.stringify(newData, null, 2);
    const base64Content = utf8ToBase64(json);
    
    const updRes = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            message: commitMsg,
            content: base64Content,
            sha: sha,
            branch: branch
        })
    });
    
    if (!updRes.ok) {
        const err = await updRes.json();
        throw new Error(`Ошибка: ${err.message || 'Неизвестная'}`);
    }
    
    return newData;
}

// ============================================================
// ====== ПРОВЕРКА СТАТУСА GITHUB ======
// ============================================================

async function checkGitHub() {
    const badge = $('statusBadge');
    try {
        const { token, owner, repo } = GITHUB_CONFIG;
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        if (res.ok) {
            badge.className = 'status-badge success';
            badge.textContent = '✅ GitHub: подключен';
            return true;
        } else {
            throw new Error('Unauthorized');
        }
    } catch (e) {
        badge.className = 'status-badge error';
        badge.textContent = '❌ GitHub: ошибка';
        toast('Ошибка подключения к GitHub. Проверьте токен.', 'error');
        return false;
    }
}

// ============================================================
// ====== ОСНОВНЫЕ ФУНКЦИИ ======
// ============================================================

// ----- ДОБАВЛЕНИЕ ТОВАРА -----
async function addProduct(formId, category, categoryLabel) {
    if (state.isUploading) { toast('Подождите...', 'info'); return; }
    
    const form = $(formId);
    const name = form.querySelector('input[type="text"]').value.trim();
    const price = parseFloat(form.querySelector('input[type="number"]').value.trim());
    const desc = form.querySelector('textarea').value.trim();
    const file = form.querySelector('input[type="file"]').files[0];
    const submit = form.querySelector('.submit-btn');
    const progress = form.querySelector('.progress');
    const fill = progress.querySelector('.fill');
    const text = progress.querySelector('.text');
    
    if (!name || isNaN(price) || price <= 0) {
        toast('Введите название и цену', 'error');
        return;
    }
    if (!file) { toast('Выберите изображение', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Файл > 5MB', 'error'); return; }
    
    state.isUploading = true;
    submit.disabled = true;
    submit.textContent = '⏳ Загрузка...';
    progress.classList.add('active');
    text.textContent = '📤 Загрузка изображения...';
    
    try {
        fill.style.width = '30%';
        const imageUrl = await uploadImage(file, category);
        fill.style.width = '60%';
        text.textContent = '💾 Сохранение данных...';
        
        const product = {
            id: Date.now(),
            name,
            price,
            desc: desc || 'Без описания',
            image: imageUrl,
            category,
            uploadedAt: new Date().toISOString()
        };
        
        state.products.push(product);
        saveToLocalStorage();
        
        fill.style.width = '80%';
        text.textContent = '🔄 Отправка на GitHub...';
        await pushToGitHub('data.json', state.products, `Добавлен товар: ${name}`);
        
        fill.style.width = '100%';
        text.textContent = '✅ Готово!';
        toast(`✅ ${categoryLabel} добавлена и опубликована!`, 'success');
        
        form.reset();
        const preview = form.querySelector('.preview');
        const fname = form.querySelector('.fname');
        preview.innerHTML = '<span class="empty">🖼️ Предпросмотр</span>';
        fname.textContent = 'файл не выбран';
        renderList(category);
        
        state.lastSync = new Date().toLocaleString();
        updateSyncStatus();
        
    } catch (e) {
        toast(`❌ ${e.message}`, 'error');
        console.error(e);
    } finally {
        state.isUploading = false;
        submit.disabled = false;
        submit.textContent = `➕ Добавить ${categoryLabel.toLowerCase()}`;
        setTimeout(() => {
            progress.classList.remove('active');
            fill.style.width = '0%';
        }, 1500);
    }
}

// ----- ДОБАВЛЕНИЕ СЛАЙДА -----
async function addSlide() {
    if (state.isUploading) { toast('Подождите...', 'info'); return; }
    
    const title = $('slideTitle').value.trim() || 'Слайд';
    const subtitle = $('slideSub').value.trim();
    const link = $('slideLink').value.trim() || '#';
    const file = $('slideFile').files[0];
    const submit = $('slideSubmit');
    const progress = $('slideProgress');
    const fill = $('slideFill');
    const text = progress.querySelector('.text');
    
    if (!file) { toast('Выберите изображение', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { toast('Файл > 5MB', 'error'); return; }
    
    state.isUploading = true;
    submit.disabled = true;
    submit.textContent = '⏳ Загрузка...';
    progress.classList.add('active');
    text.textContent = '📤 Загрузка изображения...';
    
    try {
        fill.style.width = '30%';
        const imageUrl = await uploadImage(file, 'slides');
        fill.style.width = '60%';
        text.textContent = '💾 Сохранение данных...';
        
        const slide = {
            id: Date.now(),
            image: imageUrl,
            title,
            subtitle,
            link,
            active: true
        };
        
        state.slides.push(slide);
        saveToLocalStorage();
        
        fill.style.width = '80%';
        text.textContent = '🔄 Отправка на GitHub...';
        await pushToGitHub('slides.json', state.slides, `Добавлен слайд: ${title}`);
        
        fill.style.width = '100%';
        text.textContent = '✅ Готово!';
        toast('✅ Слайд добавлен и опубликован!', 'success');
        
        $('formSlide').reset();
        $('slidePreview').innerHTML = '<span class="empty">🖼️ Предпросмотр</span>';
        $('slideFname').textContent = 'файл не выбран';
        renderSlides();
        
        state.lastSync = new Date().toLocaleString();
        updateSyncStatus();
        
    } catch (e) {
        toast(`❌ ${e.message}`, 'error');
        console.error(e);
    } finally {
        state.isUploading = false;
        submit.disabled = false;
        submit.textContent = '➕ Добавить слайд';
        setTimeout(() => {
            progress.classList.remove('active');
            fill.style.width = '0%';
        }, 1500);
    }
}

// ----- РЕДАКТИРОВАНИЕ -----
function openEditModal(id, type) {
    state.editingId = id;
    state.editingType = type;
    
    const modal = $('editModal');
    const title = $('modalTitle');
    const fields = $('editFields');
    const preview = $('editPreview');
    const submit = $('editSubmit');
    
    modal.classList.add('active');
    submit.textContent = '💾 Сохранить изменения';
    submit.disabled = false;
    
    $('editFile').value = '';
    $('editFname').textContent = 'файл не выбран';
    preview.innerHTML = '<span class="empty">🖼️ Текущее изображение</span>';
    $('editProgress').classList.remove('active');
    $('editFill').style.width = '0%';
    
    if (type === 'product') {
        const product = state.products.find(p => p.id === id);
        if (!product) { toast('Товар не найден', 'error'); return; }
        
        title.textContent = '✏️ Редактировать товар';
        fields.innerHTML = `
            <div class="full"><label>Название *</label><input type="text" id="editName" value="${product.name.replace(/"/g, '&quot;')}" required></div>
            <div><label>Цена (₽) *</label><input type="number" id="editPrice" value="${product.price}" min="1" required></div>
            <div class="full"><label>Категория</label>
                <select id="editCategorySelect">
                    <option value="3d-models" ${product.category === '3d-models' ? 'selected' : ''}>3D-модель</option>
                    <option value="textures" ${product.category === 'textures' ? 'selected' : ''}>Текстура</option>
                    <option value="projects" ${product.category === 'projects' ? 'selected' : ''}>Проект</option>
                </select>
            </div>
            <div class="full"><label>Описание</label><textarea id="editDesc">${(product.desc || '').replace(/"/g, '&quot;')}</textarea></div>
        `;
        $('editId').value = product.id;
        $('editType').value = 'product';
        $('editCategory').value = product.category;
        
        if (product.image) {
            preview.innerHTML = `<img src="${product.image}" alt="Текущее" style="max-height:120px;max-width:200px;border:1px solid #2a2a32;"><span style="color:#6b7280;font-size:13px;">Текущее изображение</span>`;
        }
        
    } else if (type === 'slide') {
        const slide = state.slides.find(s => s.id === id);
        if (!slide) { toast('Слайд не найден', 'error'); return; }
        
        title.textContent = '✏️ Редактировать слайд';
        fields.innerHTML = `
            <div class="full"><label>Заголовок</label><input type="text" id="editTitle" value="${(slide.title || '').replace(/"/g, '&quot;')}"></div>
            <div class="full"><label>Подзаголовок</label><input type="text" id="editSub" value="${(slide.subtitle || '').replace(/"/g, '&quot;')}"></div>
            <div class="full"><label>Ссылка</label><input type="text" id="editLink" value="${(slide.link || '#').replace(/"/g, '&quot;')}"></div>
        `;
        $('editId').value = slide.id;
        $('editType').value = 'slide';
        
        if (slide.image) {
            preview.innerHTML = `<img src="${slide.image}" alt="Текущее" style="max-height:120px;max-width:200px;border:1px solid #2a2a32;"><span style="color:#6b7280;font-size:13px;">Текущее изображение</span>`;
        }
    }
}

function closeEditModal() {
    $('editModal').classList.remove('active');
    state.editingId = null;
    state.editingType = null;
}

async function saveEdit(e) {
    e.preventDefault();
    if (state.isUploading) { toast('Подождите...', 'info'); return; }
    
    const id = parseInt($('editId').value);
    const type = $('editType').value;
    const file = $('editFile').files[0];
    const submit = $('editSubmit');
    const progress = $('editProgress');
    const fill = $('editFill');
    const text = progress.querySelector('.text');
    
    state.isUploading = true;
    submit.disabled = true;
    submit.textContent = '⏳ Сохранение...';
    
    try {
        let newImageUrl = null;
        
        if (file) {
            if (file.size > 5 * 1024 * 1024) { toast('Файл > 5MB', 'error'); return; }
            progress.classList.add('active');
            text.textContent = '📤 Загрузка нового изображения...';
            fill.style.width = '30%';
            const category = type === 'product' ? $('editCategory').value : 'slides';
            newImageUrl = await uploadImage(file, category);
            fill.style.width = '60%';
        }
        
        text.textContent = '💾 Сохранение данных...';
        
        if (type === 'product') {
            const product = state.products.find(p => p.id === id);
            if (!product) { toast('Товар не найден', 'error'); return; }
            
            product.name = $('editName').value.trim() || 'Без названия';
            product.price = parseFloat($('editPrice').value.trim()) || 0;
            product.desc = $('editDesc').value.trim() || 'Без описания';
            product.category = $('editCategorySelect').value;
            if (newImageUrl) product.image = newImageUrl;
            
            saveToLocalStorage();
            fill.style.width = '80%';
            text.textContent = '🔄 Отправка на GitHub...';
            await pushToGitHub('data.json', state.products, `Обновлен товар: ${product.name}`);
            fill.style.width = '100%';
            toast('✅ Товар обновлен!', 'success');
            renderList(product.category);
            
        } else if (type === 'slide') {
            const slide = state.slides.find(s => s.id === id);
            if (!slide) { toast('Слайд не найден', 'error'); return; }
            
            slide.title = $('editTitle').value.trim() || 'Слайд';
            slide.subtitle = $('editSub').value.trim();
            slide.link = $('editLink').value.trim() || '#';
            if (newImageUrl) slide.image = newImageUrl;
            
            saveToLocalStorage();
            fill.style.width = '80%';
            text.textContent = '🔄 Отправка на GitHub...';
            await pushToGitHub('slides.json', state.slides, `Обновлен слайд: ${slide.title}`);
            fill.style.width = '100%';
            toast('✅ Слайд обновлен!', 'success');
            renderSlides();
        }
        
        state.lastSync = new Date().toLocaleString();
        updateSyncStatus();
        closeEditModal();
        
    } catch (e) {
        toast(`❌ ${e.message}`, 'error');
        console.error(e);
    } finally {
        state.isUploading = false;
        submit.disabled = false;
        submit.textContent = '💾 Сохранить изменения';
        setTimeout(() => {
            progress.classList.remove('active');
            fill.style.width = '0%';
        }, 1500);
    }
}

// ----- УДАЛЕНИЕ -----
async function deleteProduct(id) {
    if (!confirm('Удалить товар?')) return;
    const product = state.products.find(p => p.id === id);
    state.products = state.products.filter(p => p.id !== id);
    saveToLocalStorage();
    
    try {
        await pushToGitHub('data.json', state.products, `Удален товар: ${product ? product.name : 'без названия'}`);
        toast('🗑️ Товар удален с GitHub', 'success');
    } catch (e) {
        toast(`⚠️ Товар удален локально, но не на GitHub: ${e.message}`, 'error');
    }
    
    renderList(state.currentTab);
    state.lastSync = new Date().toLocaleString();
    updateSyncStatus();
}

async function deleteSlide(id) {
    if (!confirm('Удалить слайд?')) return;
    const slide = state.slides.find(s => s.id === id);
    state.slides = state.slides.filter(s => s.id !== id);
    saveToLocalStorage();
    
    try {
        await pushToGitHub('slides.json', state.slides, `Удален слайд: ${slide ? slide.title : 'без названия'}`);
        toast('🗑️ Слайд удален с GitHub', 'success');
    } catch (e) {
        toast(`⚠️ Слайд удален локально, но не на GitHub: ${e.message}`, 'error');
    }
    
    renderSlides();
    state.lastSync = new Date().toLocaleString();
    updateSyncStatus();
}

// ====== ВКЛЮЧЕНИЕ/ОТКЛЮЧЕНИЕ СЛАЙДА ======
async function toggleSlide(id) {
    const slide = state.slides.find(s => s.id === id);
    if (!slide) return;
    slide.active = !slide.active;
    saveToLocalStorage();
    
    try {
        await pushToGitHub('slides.json', state.slides, `${slide.active ? 'Активирован' : 'Деактивирован'} слайд: ${slide.title}`);
        toast(`✅ Слайд ${slide.active ? 'активирован' : 'деактивирован'} на GitHub`, 'success');
    } catch (e) {
        toast(`⚠️ Локально изменено, но не на GitHub: ${e.message}`, 'error');
    }
    
    renderSlides();
    state.lastSync = new Date().toLocaleString();
    updateSyncStatus();
}

// ====== КОПИРОВАНИЕ ССЫЛКИ ======
function copyUrl(id) {
    const product = state.products.find(p => p.id === id);
    if (!product) return;
    navigator.clipboard.writeText(product.image).then(
        () => toast('✅ Ссылка скопирована!', 'success'),
        () => toast('❌ Ошибка копирования', 'error')
    );
}

// ====== СТАТУС СИНХРОНИЗАЦИИ ======
function updateSyncStatus() {
    const statusEl = $('syncStatus');
    if (statusEl) {
        statusEl.textContent = state.lastSync ? `🔄 Синхронизировано: ${state.lastSync}` : '🔄 Синхронизация не выполнялась';
        statusEl.style.color = '#9ca3af';
    }
}

// ============================================================
// ====== РЕНДЕР СПИСКОВ ======
// ============================================================

function renderList(category) {
    const map = {
        'models': { list: 'modelList', count: 'modelCount', tag: 'models', label: '3D-модель' },
        'textures': { list: 'texList', count: 'texCount', tag: 'textures', label: 'Текстура' },
        'projects': { list: 'projList', count: 'projCount', tag: 'projects', label: 'Проект' }
    };
    
    const cfg = map[category];
    if (!cfg) return;
    
    const container = $(cfg.list);
    const countEl = $(cfg.count);
    const items = state.products.filter(p => p.category === category);
    
    countEl.textContent = `${items.length} шт.`;
    
    if (!items.length) {
        container.innerHTML = `<div class="empty">📭 Нет товаров</div>`;
        return;
    }
    
    container.innerHTML = items.map(p => `
        <div class="item" data-id="${p.id}">
            <img class="thumb" src="${p.image || 'https://placehold.co/60x60/1a1a22/6b7280?text=Нет'}" 
                 onerror="this.src='https://placehold.co/60x60/1a1a22/6b7280?text=Нет'" 
                 alt="${p.name}">
            <div class="info">
                <div class="name">${p.name}</div>
                <div class="desc">${p.desc || 'Без описания'}</div>
                <div class="price">${p.price.toLocaleString()} ₽</div>
                <span class="tag ${cfg.tag}">${cfg.label}</span>
            </div>
            <div class="actions">
                <button class="edit" onclick="openEditModal(${p.id}, 'product')" title="Редактировать">✏️</button>
                <button class="copy" onclick="copyUrl(${p.id})" title="Копировать ссылку">🔗</button>
                <button class="del" onclick="deleteProduct(${p.id})" title="Удалить">🗑️</button>
            </div>
        </div>
    `).join('');
}

function renderSlides() {
    const container = $('slideList');
    const countEl = $('slideCount');
    
    countEl.textContent = `${state.slides.length} шт.`;
    
    if (!state.slides.length) {
        container.innerHTML = `<div class="empty">🖼️ Нет слайдов</div>`;
        return;
    }
    
    container.innerHTML = state.slides.map(s => `
        <div class="item slide" data-id="${s.id}">
            <img class="thumb" src="${s.image}" onerror="this.src='https://placehold.co/100x56/1a1a22/6b7280?text=Slide'" alt="${s.title}">
            <div class="info">
                <div class="name">${s.title || 'Без названия'}</div>
                <div class="desc">${s.subtitle || ''} ${s.active ? '✅ Активен' : '⛔ Неактивен'}</div>
            </div>
            <div class="actions">
                <button class="edit" onclick="openEditModal(${s.id}, 'slide')" title="Редактировать">✏️</button>
                <button class="toggle ${s.active ? '' : 'off'}" onclick="toggleSlide(${s.id})" title="${s.active ? 'Отключить' : 'Включить'}">${s.active ? '🔇' : '🔊'}</button>
                <button class="del" onclick="deleteSlide(${s.id})" title="Удалить">🗑️</button>
            </div>
        </div>
    `).join('');
}

// ============================================================
// ====== СИНХРОНИЗАЦИЯ (АДМИНКА ← GITHUB) ======
// ============================================================

async function syncFromGitHub() {
    toast('🔄 Синхронизация с GitHub...', 'info');
    await loadFromGitHub();
    renderList(state.currentTab);
    renderSlides();
    updateSyncStatus();
    await checkGitHub();
    toast(`✅ Синхронизация завершена! Товаров: ${state.products.length}, Слайдов: ${state.slides.length}`, 'success');
}

// ============================================================
// ====== ПРЕДПРОСМОТР ======
// ============================================================

function setupPreview(fileId, previewId, fnameId) {
    const file = $(fileId);
    const preview = $(previewId);
    const fname = $(fnameId);
    
    file.addEventListener('change', function() {
        const f = this.files[0];
        if (!f) {
            fname.textContent = 'файл не выбран';
            preview.innerHTML = '<span class="empty">🖼️ Предпросмотр</span>';
            return;
        }
        fname.textContent = f.name;
        const reader = new FileReader();
        reader.onload = e => {
            preview.innerHTML = `<img src="${e.target.result}" alt="Превью"><span style="color:#6b7280;font-size:13px;">${f.name} (${(f.size/1024).toFixed(1)} KB)</span>`;
        };
        reader.readAsDataURL(f);
    });
}

// ============================================================
// ====== ВКЛАДКИ ======
// ============================================================

function setupTabs() {
    const tabs = qsa('.tab-btn');
    tabs.forEach(btn => {
        btn.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const tab = this.dataset.tab;
            state.currentTab = tab;
            qsa('.tab-content').forEach(c => c.classList.remove('active'));
            $(`tab-${tab}`).classList.add('active');
            if (tab === 'slides') renderSlides();
            else renderList(tab);
        });
    });
}

// ============================================================
// ====== ВЫХОД ======
// ============================================================

function logout() {
    if (!confirm('Выйти из админки?')) return;
    window.location.reload();
}

// ============================================================
// ====== ИНИЦИАЛИЗАЦИЯ ======
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Админ-панель v2.2.0 загружается...');
    console.log('🔄 Двусторонняя синхронизация: админка ↔ GitHub ↔ витрина');
    
    if (!checkConfig()) return;
    
    // Загружаем данные с GitHub
    await loadFromGitHub();
    await checkGitHub();
    
    setupTabs();
    renderList('models');
    renderSlides();
    updateSyncStatus();
    
    // Предпросмотр
    setupPreview('modelFile', 'modelPreview', 'modelFname');
    setupPreview('texFile', 'texPreview', 'texFname');
    setupPreview('projFile', 'projPreview', 'projFname');
    setupPreview('slideFile', 'slidePreview', 'slideFname');
    setupPreview('editFile', 'editPreview', 'editFname');
    
    // Формы добавления
    $('formModel').addEventListener('submit', e => {
        e.preventDefault();
        addProduct('formModel', '3d-models', 'Модель');
    });
    $('formTexture').addEventListener('submit', e => {
        e.preventDefault();
        addProduct('formTexture', 'textures', 'Текстура');
    });
    $('formProject').addEventListener('submit', e => {
        e.preventDefault();
        addProduct('formProject', 'projects', 'Проект');
    });
    $('formSlide').addEventListener('submit', e => {
        e.preventDefault();
        addSlide();
    });
    
    // Модалка редактирования
    $('editForm').addEventListener('submit', saveEdit);
    $('modalClose').addEventListener('click', closeEditModal);
    $('editCancel').addEventListener('click', closeEditModal);
    $('editModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
    
    // Кнопки
    $('syncBtn').addEventListener('click', syncFromGitHub);
    $('logoutBtn').addEventListener('click', logout);
    
    console.log(`✅ Админка v2.2.0 загружена. Товаров: ${state.products.length}, Слайдов: ${state.slides.length}`);
    console.log(`🔄 Последняя синхронизация: ${state.lastSync || 'ещё не выполнялась'}`);
});
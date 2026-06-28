// ====== ВЕРСИЯ ======
const VERSION = '3.3.0';

// ====== КАТЕГОРИИ ======
const CATEGORY_LABELS = {
    '3d-models': '3D-модель',
    'textures': 'Текстура',
    'projects': 'Проект'
};

const CATEGORY_ICONS = {
    '3d-models': '🎲',
    'textures': '🎨',
    'projects': '📐'
};

// ====== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======
let products = [];
let cart = [];
let currentCategory = 'all';
let slides = [];
let currentSlide = 0;
let slideInterval = null;

// ====== ЗАГРУЗКА ДАННЫХ ======
async function loadData() {
    console.log(`🔍 [${VERSION}] Загрузка данных...`);
    
    // Загружаем товары
    try {
        const response = await fetch('data.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                products = data;
                localStorage.setItem('3dshop_products', JSON.stringify(products));
                console.log(`✅ Загружено ${products.length} товаров из data.json`);
            }
        }
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить data.json:', e.message);
    }
    
    if (products.length === 0) {
        const saved = localStorage.getItem('3dshop_products');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    products = parsed;
                    console.log(`✅ Загружено ${products.length} товаров из localStorage`);
                }
            } catch (e) {}
        }
    }
    
    if (products.length === 0) {
        console.log('🔄 Создаем демо-данные...');
        products = [
            { id: 1, name: 'Sci-Fi Rifle', price: 1490, desc: 'Высокополигональная модель. FBX, OBJ. 4K текстуры.', image: 'https://placehold.co/600x400/1a1a22/a78bfa?text=Sci-Fi+Rifle', category: '3d-models' },
            { id: 2, name: 'Low Poly House', price: 890, desc: 'Оптимизированная модель для игр. 1.2K полигонов.', image: 'https://placehold.co/600x400/1a1a22/60a5fa?text=Low+Poly+House', category: '3d-models' },
            { id: 3, name: 'Metal Roughness 4K', price: 590, desc: 'Набор текстур металла. Diffuse, Normal, Roughness.', image: 'https://placehold.co/600x400/1a1a22/34d399?text=Metal+Roughness+4K', category: 'textures' },
            { id: 4, name: 'Brick Wall Texture', price: 390, desc: 'Кирпичная стена. 2K, PBR-текстуры.', image: 'https://placehold.co/600x400/1a1a22/fbbf24?text=Brick+Wall', category: 'textures' },
            { id: 5, name: 'Архитектурный проект «Куб»', price: 3500, desc: 'Полный проект дома. 3D-модель, чертежи, визуализации.', image: 'https://placehold.co/600x400/1a1a22/34d399?text=Project+Cube', category: 'projects' }
        ];
        localStorage.setItem('3dshop_products', JSON.stringify(products));
    }
    
    // Загружаем слайды
    try {
        const slideResponse = await fetch('slides.json?t=' + Date.now());
        if (slideResponse.ok) {
            const slideData = await slideResponse.json();
            if (Array.isArray(slideData) && slideData.length > 0) {
                slides = slideData.filter(s => s.active !== false);
                console.log(`✅ Загружено ${slides.length} слайдов из slides.json`);
            }
        }
    } catch (e) {
        console.warn('⚠️ Не удалось загрузить slides.json:', e.message);
    }
    
    if (slides.length === 0) {
        slides = [
            { id: 1, image: 'https://placehold.co/1200x400/2a1f3d/a78bfa?text=Добро+пожаловать!', title: '3D модели, текстуры и проекты', subtitle: 'Высокое качество, низкие цены', link: '#', active: true },
            { id: 2, image: 'https://placehold.co/1200x400/1f2a3d/60a5fa?text=Новые+поступления', title: 'Свежие коллекции', subtitle: 'Обновления каждый день', link: '#', active: true }
        ];
    }
}

function saveProducts() {
    localStorage.setItem('3dshop_products', JSON.stringify(products));
}

function loadCart() {
    const saved = localStorage.getItem('3dshop_cart');
    if (saved) {
        try { cart = JSON.parse(saved); } catch (e) {}
    }
}

function saveCart() {
    localStorage.setItem('3dshop_cart', JSON.stringify(cart));
}

// ====== СЛАЙД-БАР ======
function renderSlider() {
    const track = document.getElementById('sliderTrack');
    const dots = document.getElementById('sliderDots');
    const container = document.getElementById('sliderContainer');
    
    if (!slides || slides.length === 0) {
        container.classList.remove('active');
        return;
    }
    
    container.classList.add('active');
    
    track.innerHTML = slides.map(s => `
        <div class="slider-slide">
            <img src="${s.image}" alt="${s.title}" onerror="this.src='https://placehold.co/1200x400/1a1a22/6b7280?text=Slide+${s.id}'">
            <div class="slide-content">
                <h2>${s.title || ''}</h2>
                <p>${s.subtitle || ''}</p>
                ${s.link && s.link !== '#' ? `<a href="${s.link}" class="slide-link">Подробнее →</a>` : ''}
            </div>
        </div>
    `).join('');
    
    dots.innerHTML = slides.map((_, i) => `
        <button class="dot ${i === 0 ? 'active' : ''}" data-index="${i}"></button>
    `).join('');
    
    dots.querySelectorAll('.dot').forEach(dot => {
        dot.addEventListener('click', function() {
            goToSlide(parseInt(this.dataset.index));
        });
    });
    
    currentSlide = 0;
    updateSlider();
    startAutoSlide();
}

function updateSlider() {
    const track = document.getElementById('sliderTrack');
    const dots = document.querySelectorAll('.dot');
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlide = index;
    updateSlider();
    resetAutoSlide();
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}

function prevSlide() {
    goToSlide(currentSlide - 1);
}

function startAutoSlide() {
    if (slideInterval) clearInterval(slideInterval);
    if (slides.length > 1) {
        slideInterval = setInterval(nextSlide, 5000);
    }
}

function resetAutoSlide() {
    if (slideInterval) {
        clearInterval(slideInterval);
        if (slides.length > 1) {
            slideInterval = setInterval(nextSlide, 5000);
        }
    }
}

// ====== ПОДСЧЕТ КАТЕГОРИЙ ======
function updateCategoryCounts() {
    document.getElementById('allCount').textContent = products.length;
    document.getElementById('modelsCount').textContent = products.filter(p => p.category === '3d-models').length;
    document.getElementById('texturesCount').textContent = products.filter(p => p.category === 'textures').length;
    document.getElementById('projectsCount').textContent = products.filter(p => p.category === 'projects').length;
}

function getValidImageUrl(url) {
    if (!url) return 'https://placehold.co/400x200/1a1a22/6b7280?text=Нет+изображения';
    if (typeof url === 'string') {
        if (url.startsWith('data:image')) return url;
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
            return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
        return url;
    }
    return 'https://placehold.co/400x200/1a1a22/6b7280?text=Нет+изображения';
}

// ====== РЕНДЕР ТОВАРОВ ======
function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    
    // Показываем/скрываем слайдер
    const slider = document.getElementById('sliderContainer');
    if (currentCategory === 'all') {
        slider.classList.add('active');
        if (slides.length === 0) {
            renderSlider();
        }
    } else {
        slider.classList.remove('active');
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Нет товаров в этой категории</p></div>`;
        return;
    }
    
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const catLabel = CATEGORY_LABELS[p.category] || p.category;
        const catClass = p.category === 'textures' ? 'texture' : p.category === 'projects' ? 'project' : '';
        const imgUrl = getValidImageUrl(p.image);
        card.innerHTML = `
            <span class="category-badge ${catClass}">${catLabel}</span>
            <div class="image-wrapper">
                <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'image-error\\'>🖼️<br><span style=\\'font-size:11px;color:#6b7280;\\'>Не загружено</span></div>'">
            </div>
            <h3>${p.name}</h3>
            <div class="desc">${p.desc || 'Без описания'}</div>
            <div class="price">${p.price.toLocaleString()} ₽</div>
            <button class="buy-btn" data-id="${p.id}">Купить</button>
        `;
        grid.appendChild(card);
    });
    
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addToCart(parseInt(this.dataset.id));
        });
    });
}

// ====== ВКЛАДКИ ======
function setupCategoryTabs() {
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderProducts();
        });
    });
}

// ====== КОРЗИНА ======
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const existing = cart.find(i => i.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    const btn = document.querySelector(`.buy-btn[data-id="${id}"]`);
    if (btn) {
        btn.textContent = '✅ Добавлено!';
        btn.classList.add('added');
        setTimeout(() => {
            btn.textContent = 'Купить';
            btn.classList.remove('added');
        }, 1200);
    }
}

function removeFromCart(id) {
    cart = cart.filter(i => i.id !== id);
    saveCart();
    updateCartUI();
    renderCartModal();
}

function updateQuantity(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    saveCart();
    updateCartUI();
    renderCartModal();
}

function clearCart() {
    if (cart.length === 0) return;
    if (!confirm('Очистить корзину?')) return;
    cart = [];
    saveCart();
    updateCartUI();
    renderCartModal();
}

function updateCartUI() {
    const count = cart.reduce((s, i) => s + i.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function getCartTotal() {
    return cart.reduce((s, i) => s + i.price * i.quantity, 0);
}

function renderCartModal() {
    const container = document.getElementById('cartItems');
    const totalSpan = document.getElementById('cartTotalPrice');
    if (cart.length === 0) {
        container.innerHTML = '<p style="color: #9ca3af;">Корзина пуста</p>';
        totalSpan.textContent = '0 ₽';
        return;
    }
    let html = '';
    cart.forEach(item => {
        const icon = CATEGORY_ICONS[item.category] || '📦';
        const label = CATEGORY_LABELS[item.category] || item.category;
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-category">${icon} ${label}</span>
                    <span class="cart-item-price">${item.price} ₽</span>
                </div>
                <div class="cart-item-qty">
                    <button onclick="updateQuantity(${item.id}, -1)">−</button>
                    <span class="qty-num">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    totalSpan.textContent = getCartTotal().toLocaleString() + ' ₽';
}

function checkout() {
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    const total = getCartTotal();
    const items = cart.map(i => `- ${i.name} × ${i.quantity}`).join('\n');
    alert(`💳 Переход к оплате на сумму ${total} ₽\n\nТовары:\n${items}`);
    cart = [];
    saveCart();
    updateCartUI();
    renderCartModal();
    document.getElementById('cartModal').classList.remove('active');
}

// ====== ИНИЦИАЛИЗАЦИЯ ======
document.addEventListener('DOMContentLoaded', async function() {
    console.log(`🚀 Витрина v${VERSION} загружается...`);
    await loadData();
    loadCart();
    renderSlider();
    setupCategoryTabs();
    renderProducts();
    updateCategoryCounts();
    updateCartUI();
    
    // Кнопки слайдера
    document.getElementById('sliderPrev').addEventListener('click', prevSlide);
    document.getElementById('sliderNext').addEventListener('click', nextSlide);
    
    const modal = document.getElementById('cartModal');
    document.getElementById('openCartBtn').addEventListener('click', function() {
        renderCartModal();
        modal.classList.add('active');
    });
    document.getElementById('closeCartBtn').addEventListener('click', function() {
        modal.classList.remove('active');
    });
    modal.addEventListener('click', function(e) {
        if (e.target === this) modal.classList.remove('active');
    });
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    
    console.log(`✅ Витрина v${VERSION} загружена. Товаров: ${products.length}, Слайдов: ${slides.length}`);
});
// ====== ВЕРСИЯ ======
const VERSION = '3.0.2';

// ====== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======
let products = [];
let cart = [];
let currentCategory = 'all';
let debugVisible = true;

// ====== ЗАГРУЗКА ДАННЫХ ИЗ localStorage ======
function loadData() {
    console.log(`🔍 [${VERSION}] Загрузка данных...`);
    
    const savedProducts = localStorage.getItem('3dshop_products');
    console.log('📦 Сырые данные из localStorage:', savedProducts ? savedProducts.substring(0, 300) + '...' : 'null');
    
    if (savedProducts) {
        try {
            const parsed = JSON.parse(savedProducts);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
                console.log(`✅ Загружено ${products.length} товаров из localStorage`);
                products.forEach((p, i) => {
                    console.log(`📸 Товар ${i+1}: "${p.name}" → image: ${p.image ? p.image.substring(0, 80) + '...' : '❌ НЕТ'}`);
                });
                return;
            }
        } catch (e) {
            console.error('❌ Ошибка парсинга JSON:', e);
        }
    }
    
    // Если нет данных, создаем демо с РАБОЧИМИ картинками (placeholder)
    console.log('🔄 Создаем демо-данные с рабочими картинками...');
    products = [
        {
            id: 1,
            name: 'Sci-Fi Rifle',
            price: 1490,
            desc: 'Высокополигональная модель. FBX, OBJ. 4K текстуры.',
            image: 'https://placehold.co/600x400/1a1a22/a78bfa?text=Sci-Fi+Rifle',
            category: '3d-models'
        },
        {
            id: 2,
            name: 'Low Poly House',
            price: 890,
            desc: 'Оптимизированная модель для игр. 1.2K полигонов.',
            image: 'https://placehold.co/600x400/1a1a22/60a5fa?text=Low+Poly+House',
            category: '3d-models'
        },
        {
            id: 3,
            name: 'Metal Roughness 4K',
            price: 590,
            desc: 'Набор текстур металла. Diffuse, Normal, Roughness.',
            image: 'https://placehold.co/600x400/1a1a22/34d399?text=Metal+Roughness+4K',
            category: 'textures'
        },
        {
            id: 4,
            name: 'Brick Wall Texture',
            price: 390,
            desc: 'Кирпичная стена. 2K, PBR-текстуры.',
            image: 'https://placehold.co/600x400/1a1a22/fbbf24?text=Brick+Wall',
            category: 'textures'
        }
    ];
    saveProducts();
    console.log('✅ Демо-данные созданы и сохранены');
}

function saveProducts() {
    localStorage.setItem('3dshop_products', JSON.stringify(products));
    console.log(`💾 Сохранено ${products.length} товаров в localStorage`);
}

function loadCart() {
    const savedCart = localStorage.getItem('3dshop_cart');
    if (savedCart) {
        try {
            const parsed = JSON.parse(savedCart);
            if (Array.isArray(parsed)) {
                cart = parsed;
            }
        } catch (e) {}
    }
}

function saveCart() {
    localStorage.setItem('3dshop_cart', JSON.stringify(cart));
}

// ====== ОТЛАДКА ======
function updateDebug() {
    document.getElementById('debugCount').textContent = products.length;
    document.getElementById('debugKey').textContent = '3dshop_products';
    const statusEl = document.getElementById('debugStatus');
    if (products.length > 0) {
        statusEl.textContent = `✅ ${products.length} товаров`;
        statusEl.className = 'value green';
    } else {
        statusEl.textContent = '❌ Нет товаров';
        statusEl.className = 'value red';
    }
}

function toggleDebug() {
    const content = document.getElementById('debugContent');
    const btn = document.getElementById('debugToggle');
    debugVisible = !debugVisible;
    content.style.display = debugVisible ? 'flex' : 'none';
    btn.textContent = debugVisible ? 'Скрыть' : 'Показать';
}

function resetData() {
    if (!confirm('Удалить все товары из localStorage и загрузить демо?')) return;
    localStorage.removeItem('3dshop_products');
    localStorage.removeItem('3dshop_cart');
    loadData();
    loadCart();
    renderProducts();
    updateCategoryCounts();
    updateCartUI();
    updateDebug();
    console.log('🔄 Данные сброшены');
}

// ====== ПОДСЧЕТ ТОВАРОВ ======
function updateCategoryCounts() {
    const allCount = products.length;
    const modelsCount = products.filter(p => p.category === '3d-models').length;
    const texturesCount = products.filter(p => p.category === 'textures').length;
    document.getElementById('allCount').textContent = allCount;
    document.getElementById('modelsCount').textContent = modelsCount;
    document.getElementById('texturesCount').textContent = texturesCount;
}

// ====== ФУНКЦИЯ ДЛЯ ПРОВЕРКИ ИЗОБРАЖЕНИЯ ======
function getValidImageUrl(imageData) {
    if (!imageData) return 'https://placehold.co/400x200/1a1a22/6b7280?text=No+Image';
    if (typeof imageData === 'string') {
        if (imageData.startsWith('data:image')) return imageData;
        if (imageData.includes('raw.githubusercontent.com') || imageData.includes('github.com') || imageData.startsWith('http')) {
            if (imageData.includes('github.com') && !imageData.includes('raw.githubusercontent.com')) {
                return imageData.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
            }
            return imageData;
        }
        if (!imageData.startsWith('http') && !imageData.startsWith('data:')) return imageData;
    }
    if (typeof imageData === 'object' && imageData !== null) {
        if (imageData.url) return imageData.url;
        if (imageData.src) return imageData.src;
    }
    return 'https://placehold.co/400x200/1a1a22/6b7280?text=No+Image';
}

// ====== РЕНДЕР ТОВАРОВ ======
function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    console.log(`🎨 Рендеринг ${filtered.length} товаров (категория: ${currentCategory})`);
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>Нет товаров в этой категории</p><p style="font-size:14px;color:#6b7280;margin-top:6px;">Добавьте их через админ-панель <a href="admin.html" style="color:#a78bfa;">→</a></p><p style="font-size:12px;color:#6b7280;margin-top:10px;">Всего товаров: ${products.length}</p></div>`;
        return;
    }
    filtered.forEach((product) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const categoryLabel = product.category === '3d-models' ? '3D-модель' : 'Текстура';
        const categoryClass = product.category === '3d-models' ? '' : 'texture';
        const imageUrl = getValidImageUrl(product.image);
        card.innerHTML = `
            <span class="category-badge ${categoryClass}">${categoryLabel}</span>
            <div class="image-wrapper">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<div class=\\'image-error\\'>🖼️<br><span style=\\'font-size:11px;color:#6b7280;\\'>Не загружено</span></div>'">
            </div>
            <h3>${product.name}</h3>
            <div class="desc">${product.desc || 'Без описания'}</div>
            <div class="price">${product.price.toLocaleString()} ₽</div>
            <button class="buy-btn" data-id="${product.id}">Купить</button>
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
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            renderProducts();
        });
    });
}

// ====== КОРЗИНА ======
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id: product.id, name: product.name, price: product.price, category: product.category, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    const btn = document.querySelector(`.buy-btn[data-id="${productId}"]`);
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ Добавлено!';
        btn.classList.add('added');
        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('added');
        }, 1200);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartUI();
    renderCartModal();
}

function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== productId);
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
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cartCount').textContent = count;
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
        const categoryLabel = item.category === '3d-models' ? '🎲 3D' : '🎨 Текстура';
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-category">${categoryLabel}</span>
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
document.addEventListener('DOMContentLoaded', function() {
    console.log(`🚀 Витрина v${VERSION} загружается...`);
    loadData();
    loadCart();
    setupCategoryTabs();
    renderProducts();
    updateCategoryCounts();
    updateCartUI();
    updateDebug();
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
    document.getElementById('debugToggle').addEventListener('click', toggleDebug);
    document.getElementById('debugRefreshBtn').addEventListener('click', function() {
        loadData();
        renderProducts();
        updateCategoryCounts();
        updateDebug();
        console.log('🔄 Данные обновлены');
    });
    document.getElementById('debugResetBtn').addEventListener('click', resetData);
    console.log(`✅ Витрина v${VERSION} загружена. Товаров: ${products.length}`);
    products.forEach((p, i) => {
        console.log(`📸 [${i+1}] "${p.name}" → image: ${p.image ? 'ЕСТЬ' : 'НЕТ'}`);
    });
});
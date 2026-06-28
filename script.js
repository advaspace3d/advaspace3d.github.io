// ====== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ======
let products = [];
let cart = [];
let currentCategory = 'all';

// ====== ЗАГРУЗКА ДАННЫХ ИЗ localStorage ======
function loadData() {
    const savedProducts = localStorage.getItem('3dshop_products');
    const savedCart = localStorage.getItem('3dshop_cart');
    
    if (savedProducts) {
        try {
            const parsed = JSON.parse(savedProducts);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
            }
        } catch (e) {}
    }
    
    // Если нет товаров, создаем демо-данные
    if (products.length === 0) {
        products = [
            {
                id: 1,
                name: 'Sci-Fi Rifle',
                price: 1490,
                desc: 'Высокополигональная модель. FBX, OBJ. 4K текстуры.',
                image: 'https://images.pexels.com/photos/4250273/pexels-photo-4250273.jpeg?auto=compress&cs=tinysrgb&w=400',
                category: '3d-models'
            },
            {
                id: 2,
                name: 'Low Poly House',
                price: 890,
                desc: 'Оптимизированная модель для игр. 1.2K полигонов.',
                image: 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=400',
                category: '3d-models'
            },
            {
                id: 3,
                name: 'Metal Roughness 4K',
                price: 590,
                desc: 'Набор текстур металла. Diffuse, Normal, Roughness.',
                image: 'https://images.pexels.com/photos/2528118/pexels-photo-2528118.jpeg?auto=compress&cs=tinysrgb&w=400',
                category: 'textures'
            },
            {
                id: 4,
                name: 'Brick Wall Texture',
                price: 390,
                desc: 'Кирпичная стена. 2K, PBR-текстуры.',
                image: 'https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=400',
                category: 'textures'
            }
        ];
        saveProducts();
    }
    
    if (savedCart) {
        try {
            const parsed = JSON.parse(savedCart);
            if (Array.isArray(parsed)) {
                cart = parsed;
            }
        } catch (e) {}
    }
}

function saveProducts() {
    localStorage.setItem('3dshop_products', JSON.stringify(products));
}

function saveCart() {
    localStorage.setItem('3dshop_cart', JSON.stringify(cart));
}

// ====== ПОДСЧЕТ ТОВАРОВ ПО КАТЕГОРИЯМ ======
function updateCategoryCounts() {
    const allCount = products.length;
    const modelsCount = products.filter(p => p.category === '3d-models').length;
    const texturesCount = products.filter(p => p.category === 'textures').length;
    
    document.getElementById('allCount').textContent = allCount;
    document.getElementById('modelsCount').textContent = modelsCount;
    document.getElementById('texturesCount').textContent = texturesCount;
}

// ====== РЕНДЕР ТОВАРОВ ======
function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>Нет товаров в этой категории</p>
                <p style="font-size:14px;color:#6b7280;margin-top:6px;">Добавьте их через админ-панель</p>
            </div>
        `;
        return;
    }
    
    filtered.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        const categoryLabel = product.category === '3d-models' ? '3D-модель' : 'Текстура';
        const categoryClass = product.category === '3d-models' ? '' : 'texture';
        
        card.innerHTML = `
            <span class="category-badge ${categoryClass}">${categoryLabel}</span>
            <img src="${product.image || 'https://placehold.co/400x200/1a1a22/6b7280?text=No+Image'}" 
                 alt="${product.name}"
                 onerror="this.src='https://placehold.co/400x200/1a1a22/6b7280?text=No+Image'">
            <h3>${product.name}</h3>
            <div class="desc">${product.desc || 'Без описания'}</div>
            <div class="price">${product.price.toLocaleString()} ₽</div>
            <button class="buy-btn" data-id="${product.id}">Купить</button>
        `;
        grid.appendChild(card);
    });
    
    // Обработчики на кнопки "Купить"
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            addToCart(id);
        });
    });
}

// ====== ВКЛАДКИ КАТЕГОРИЙ ======
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
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            category: product.category,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartUI();
    
    // Анимация кнопки
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

// ====== МОДАЛЬНОЕ ОКНО КОРЗИНЫ ======
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

// ====== ОПЛАТА ======
function checkout() {
    if (cart.length === 0) {
        alert('Корзина пуста!');
        return;
    }
    
    const total = getCartTotal();
    const items = cart.map(i => `- ${i.name} × ${i.quantity}`).join('\n');
    
    alert(`💳 Переход к оплате на сумму ${total} ₽\n\nТовары:\n${items}`);
    
    // Очистка корзины
    cart = [];
    saveCart();
    updateCartUI();
    renderCartModal();
    
    // Закрываем модалку
    document.getElementById('cartModal').classList.remove('active');
}

// ====== ИНИЦИАЛИЗАЦИЯ ======
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupCategoryTabs();
    renderProducts();
    updateCategoryCounts();
    updateCartUI();
    
    // Модалка корзины
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
    
    // Очистка корзины
    document.getElementById('clearCartBtn').addEventListener('click', clearCart);
    
    // Оплата
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    
    console.log(`🏪 Витрина загружена. Товаров: ${products.length}`);
});
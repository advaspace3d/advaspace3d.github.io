// ====== VERSION ======
const VERSION = '3.1.2';

// ====== CATEGORIES ======
const CATEGORY_LABELS = {
    '3d-models': '3D Model',
    'textures': 'Texture',
    'projects': 'Project'
};

const CATEGORY_ICONS = {
    '3d-models': '🎲',
    'textures': '🎨',
    'projects': '📐'
};

// ====== GLOBAL VARIABLES ======
let products = [];
let cart = [];
let currentCategory = 'all';

// ====== LOAD DATA FROM data.json ======
async function loadData() {
    console.log(`🔍 [${VERSION}] Loading data...`);
    
    try {
        const response = await fetch('data.json?t=' + Date.now());
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                products = data;
                localStorage.setItem('3dshop_products', JSON.stringify(products));
                console.log(`✅ Loaded ${products.length} products from data.json`);
                return;
            }
        }
    } catch (e) {
        console.warn('⚠️ Could not load data.json:', e.message);
    }
    
    const saved = localStorage.getItem('3dshop_products');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
                console.log(`✅ Loaded ${products.length} products from localStorage`);
                return;
            }
        } catch (e) {}
    }
    
    console.log('🔄 Creating demo data...');
    products = [
        { id: 1, name: 'Sci-Fi Rifle', price: 1490, desc: 'High-poly model. FBX, OBJ. 4K textures.', image: 'https://placehold.co/600x400/1a1a22/a78bfa?text=Sci-Fi+Rifle', category: '3d-models' },
        { id: 2, name: 'Low Poly House', price: 890, desc: 'Optimized for games. 1.2K polygons.', image: 'https://placehold.co/600x400/1a1a22/60a5fa?text=Low+Poly+House', category: '3d-models' },
        { id: 3, name: 'Metal Roughness 4K', price: 590, desc: 'Metal texture set. Diffuse, Normal, Roughness.', image: 'https://placehold.co/600x400/1a1a22/34d399?text=Metal+Roughness+4K', category: 'textures' },
        { id: 4, name: 'Brick Wall Texture', price: 390, desc: 'Brick wall. 2K, PBR textures.', image: 'https://placehold.co/600x400/1a1a22/fbbf24?text=Brick+Wall', category: 'textures' },
        { id: 5, name: 'Architectural Project Cube', price: 3500, desc: 'Complete house project. 3D model, blueprints, visualizations.', image: 'https://placehold.co/600x400/1a1a22/34d399?text=Project+Cube', category: 'projects' }
    ];
    localStorage.setItem('3dshop_products', JSON.stringify(products));
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

// ====== CATEGORY COUNTS ======
function updateCategoryCounts() {
    document.getElementById('allCount').textContent = products.length;
    document.getElementById('modelsCount').textContent = products.filter(p => p.category === '3d-models').length;
    document.getElementById('texturesCount').textContent = products.filter(p => p.category === 'textures').length;
    document.getElementById('projectsCount').textContent = products.filter(p => p.category === 'projects').length;
}

function getValidImageUrl(url) {
    if (!url) return 'https://placehold.co/400x200/1a1a22/6b7280?text=No+Image';
    if (typeof url === 'string') {
        if (url.startsWith('data:image')) return url;
        if (url.includes('github.com') && !url.includes('raw.githubusercontent.com')) {
            return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
        return url;
    }
    return 'https://placehold.co/400x200/1a1a22/6b7280?text=No+Image';
}

// ====== RENDER PRODUCTS ======
function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">📭</div><p>No products in this category</p></div>`;
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
                <img src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'image-error\\'>🖼️<br><span style=\\'font-size:11px;color:#6b7280;\\'>Not loaded</span></div>'">
            </div>
            <h3>${p.name}</h3>
            <div class="desc">${p.desc || 'No description'}</div>
            <div class="price">${p.price.toLocaleString()} ₽</div>
            <button class="buy-btn" data-id="${p.id}">Buy</button>
        `;
        grid.appendChild(card);
    });
    
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addToCart(parseInt(this.dataset.id));
        });
    });
}

// ====== CATEGORY TABS ======
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

// ====== CART ======
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
        btn.textContent = '✅ Added!';
        btn.classList.add('added');
        setTimeout(() => {
            btn.textContent = 'Buy';
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
    if (!confirm('Clear cart?')) return;
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
        container.innerHTML = '<p style="color: #9ca3af;">Cart is empty</p>';
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
        alert('Cart is empty!');
        return;
    }
    const total = getCartTotal();
    const items = cart.map(i => `- ${i.name} × ${i.quantity}`).join('\n');
    alert(`💳 Checkout for ${total} ₽\n\nItems:\n${items}`);
    cart = [];
    saveCart();
    updateCartUI();
    renderCartModal();
    document.getElementById('cartModal').classList.remove('active');
}

// ====== INITIALIZATION ======
document.addEventListener('DOMContentLoaded', async function() {
    console.log(`🚀 Store v${VERSION} loading...`);
    await loadData();
    loadCart();
    setupCategoryTabs();
    renderProducts();
    updateCategoryCounts();
    updateCartUI();
    
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
    
    console.log(`✅ Store v${VERSION} loaded. Products: ${products.length}`);
});
// ====== ÐÐÐ Ð¡ÐÐ¯ ======
const VERSION = '3.0.2';

// ====== ÐÐÐÐÐÐÐ¬ÐÐ«Ð ÐÐÐ ÐÐÐÐÐÐ«Ð ======
let products = [];
let cart = [];
let currentCategory = 'all';
let debugVisible = true;

// ====== ÐÐÐÐ Ð£ÐÐÐ ÐÐÐÐÐ«Ð¥ ÐÐ localStorage ======
function loadData() {
    console.log(`ð [${VERSION}] ÐÐ°Ð³ÑÑÐ·ÐºÐ° Ð´Ð°Ð½Ð½ÑÑ...`);
    
    const savedProducts = localStorage.getItem('3dshop_products');
    console.log('ð¦ Ð¡ÑÑÑÐµ Ð´Ð°Ð½Ð½ÑÐµ Ð¸Ð· localStorage:', savedProducts ? savedProducts.substring(0, 300) + '...' : 'null');
    
    if (savedProducts) {
        try {
            const parsed = JSON.parse(savedProducts);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
                console.log(`â ÐÐ°Ð³ÑÑÐ¶ÐµÐ½Ð¾ ${products.length} ÑÐ¾Ð²Ð°ÑÐ¾Ð² Ð¸Ð· localStorage`);
                products.forEach((p, i) => {
                    console.log(`ð¸ Ð¢Ð¾Ð²Ð°Ñ ${i+1}: "${p.name}" â image: ${p.image ? p.image.substring(0, 80) + '...' : 'â ÐÐÐ¢'}`);
                });
                return;
            }
        } catch (e) {
            console.error('â ÐÑÐ¸Ð±ÐºÐ° Ð¿Ð°ÑÑÐ¸Ð½Ð³Ð° JSON:', e);
        }
    }
    
    // ÐÑÐ»Ð¸ Ð½ÐµÑ Ð´Ð°Ð½Ð½ÑÑ, ÑÐ¾Ð·Ð´Ð°ÐµÐ¼ Ð´ÐµÐ¼Ð¾ Ñ Ð ÐÐÐÐ§ÐÐÐ ÐºÐ°ÑÑÐ¸Ð½ÐºÐ°Ð¼Ð¸ (placeholder)
    console.log('ð Ð¡Ð¾Ð·Ð´Ð°ÐµÐ¼ Ð´ÐµÐ¼Ð¾-Ð´Ð°Ð½Ð½ÑÐµ Ñ ÑÐ°Ð±Ð¾ÑÐ¸Ð¼Ð¸ ÐºÐ°ÑÑÐ¸Ð½ÐºÐ°Ð¼Ð¸...');
    products = [
        {
            id: 1,
            name: 'Sci-Fi Rifle',
            price: 1490,
            desc: 'ÐÑÑÐ¾ÐºÐ¾Ð¿Ð¾Ð»Ð¸Ð³Ð¾Ð½Ð°Ð»ÑÐ½Ð°Ñ Ð¼Ð¾Ð´ÐµÐ»Ñ. FBX, OBJ. 4K ÑÐµÐºÑÑÑÑÑ.',
            image: 'https://placehold.co/600x400/1a1a22/a78bfa?text=Sci-Fi+Rifle',
            category: '3d-models'
        },
        {
            id: 2,
            name: 'Low Poly House',
            price: 890,
            desc: 'ÐÐ¿ÑÐ¸Ð¼Ð¸Ð·Ð¸ÑÐ¾Ð²Ð°Ð½Ð½Ð°Ñ Ð¼Ð¾Ð´ÐµÐ»Ñ Ð´Ð»Ñ Ð¸Ð³Ñ. 1.2K Ð¿Ð¾Ð»Ð¸Ð³Ð¾Ð½Ð¾Ð².',
            image: 'https://placehold.co/600x400/1a1a22/60a5fa?text=Low+Poly+House',
            category: '3d-models'
        },
        {
            id: 3,
            name: 'Metal Roughness 4K',
            price: 590,
            desc: 'ÐÐ°Ð±Ð¾Ñ ÑÐµÐºÑÑÑÑ Ð¼ÐµÑÐ°Ð»Ð»Ð°. Diffuse, Normal, Roughness.',
            image: 'https://placehold.co/600x400/1a1a22/34d399?text=Metal+Roughness+4K',
            category: 'textures'
        },
        {
            id: 4,
            name: 'Brick Wall Texture',
            price: 390,
            desc: 'ÐÐ¸ÑÐ¿Ð¸ÑÐ½Ð°Ñ ÑÑÐµÐ½Ð°. 2K, PBR-ÑÐµÐºÑÑÑÑÑ.',
            image: 'https://placehold.co/600x400/1a1a22/fbbf24?text=Brick+Wall',
            category: 'textures'
        }
    ];
    saveProducts();
    console.log('â ÐÐµÐ¼Ð¾-Ð´Ð°Ð½Ð½ÑÐµ ÑÐ¾Ð·Ð´Ð°Ð½Ñ Ð¸ ÑÐ¾ÑÑÐ°Ð½ÐµÐ½Ñ');
}

function saveProducts() {
    localStorage.setItem('3dshop_products', JSON.stringify(products));
    console.log(`ð¾ Ð¡Ð¾ÑÑÐ°Ð½ÐµÐ½Ð¾ ${products.length} ÑÐ¾Ð²Ð°ÑÐ¾Ð² Ð² localStorage`);
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

// ====== ÐÐ¢ÐÐÐÐÐ ======
function updateDebug() {
    document.getElementById('debugCount').textContent = products.length;
    document.getElementById('debugKey').textContent = '3dshop_products';
    const statusEl = document.getElementById('debugStatus');
    if (products.length > 0) {
        statusEl.textContent = `â ${products.length} ÑÐ¾Ð²Ð°ÑÐ¾Ð²`;
        statusEl.className = 'value green';
    } else {
        statusEl.textContent = 'â ÐÐµÑ ÑÐ¾Ð²Ð°ÑÐ¾Ð²';
        statusEl.className = 'value red';
    }
}

function toggleDebug() {
    const content = document.getElementById('debugContent');
    const btn = document.getElementById('debugToggle');
    debugVisible = !debugVisible;
    content.style.display = debugVisible ? 'flex' : 'none';
    btn.textContent = debugVisible ? 'Ð¡ÐºÑÑÑÑ' : 'ÐÐ¾ÐºÐ°Ð·Ð°ÑÑ';
}

function resetData() {
    if (!confirm('Ð£Ð´Ð°Ð»Ð¸ÑÑ Ð²ÑÐµ ÑÐ¾Ð²Ð°ÑÑ Ð¸Ð· localStorage Ð¸ Ð·Ð°Ð³ÑÑÐ·Ð¸ÑÑ Ð´ÐµÐ¼Ð¾?')) return;
    localStorage.removeItem('3dshop_products');
    localStorage.removeItem('3dshop_cart');
    loadData();
    loadCart();
    renderProducts();
    updateCategoryCounts();
    updateCartUI();
    updateDebug();
    console.log('ð ÐÐ°Ð½Ð½ÑÐµ ÑÐ±ÑÐ¾ÑÐµÐ½Ñ');
}

// ====== ÐÐÐÐ¡Ð§ÐÐ¢ Ð¢ÐÐÐÐ ÐÐ ======
function updateCategoryCounts() {
    const allCount = products.length;
    const modelsCount = products.filter(p => p.category === '3d-models').length;
    const texturesCount = products.filter(p => p.category === 'textures').length;
    document.getElementById('allCount').textContent = allCount;
    document.getElementById('modelsCount').textContent = modelsCount;
    document.getElementById('texturesCount').textContent = texturesCount;
}

// ====== Ð¤Ð£ÐÐÐ¦ÐÐ¯ ÐÐÐ¯ ÐÐ ÐÐÐÐ ÐÐ ÐÐÐÐÐ ÐÐÐÐÐÐ¯ ======
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

// ====== Ð ÐÐÐÐÐ  Ð¢ÐÐÐÐ ÐÐ ======
function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    console.log(`ð¨ Ð ÐµÐ½Ð´ÐµÑÐ¸Ð½Ð³ ${filtered.length} ÑÐ¾Ð²Ð°ÑÐ¾Ð² (ÐºÐ°ÑÐµÐ³Ð¾ÑÐ¸Ñ: ${currentCategory})`);
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="empty-state"><div class="icon">ð­</div><p>ÐÐµÑ ÑÐ¾Ð²Ð°ÑÐ¾Ð² Ð² ÑÑÐ¾Ð¹ ÐºÐ°ÑÐµÐ³Ð¾ÑÐ¸Ð¸</p><p style="font-size:14px;color:#6b7280;margin-top:6px;">ÐÐ¾Ð±Ð°Ð²ÑÑÐµ Ð¸Ñ ÑÐµÑÐµÐ· Ð°Ð´Ð¼Ð¸Ð½-Ð¿Ð°Ð½ÐµÐ»Ñ <a href="admin.html" style="color:#a78bfa;">â</a></p><p style="font-size:12px;color:#6b7280;margin-top:10px;">ÐÑÐµÐ³Ð¾ ÑÐ¾Ð²Ð°ÑÐ¾Ð²: ${products.length}</p></div>`;
        return;
    }
    filtered.forEach((product) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        const categoryLabel = product.category === '3d-models' ? '3D-Ð¼Ð¾Ð´ÐµÐ»Ñ' : 'Ð¢ÐµÐºÑÑÑÑÐ°';
        const categoryClass = product.category === '3d-models' ? '' : 'texture';
        const imageUrl = getValidImageUrl(product.image);
        card.innerHTML = `
            <span class="category-badge ${categoryClass}">${categoryLabel}</span>
            <div class="image-wrapper">
                <img src="${imageUrl}" alt="${product.name}" loading="lazy" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<div class=\\'image-error\\'>ð¼ï¸<br><span style=\\'font-size:11px;color:#6b7280;\\'>ÐÐµ Ð·Ð°Ð³ÑÑÐ¶ÐµÐ½Ð¾</span></div>'">
            </div>
            <h3>${product.name}</h3>
            <div class="desc">${product.desc || 'ÐÐµÐ· Ð¾Ð¿Ð¸ÑÐ°Ð½Ð¸Ñ'}</div>
            <div class="price">${product.price.toLocaleString()} â½</div>
            <button class="buy-btn" data-id="${product.id}">ÐÑÐ¿Ð¸ÑÑ</button>
        `;
        grid.appendChild(card);
    });
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            addToCart(parseInt(this.dataset.id));
        });
    });
}

// ====== ÐÐÐÐÐÐÐ ======
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

// ====== ÐÐÐ ÐÐÐÐ ======
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
        btn.textContent = 'â ÐÐ¾Ð±Ð°Ð²Ð»ÐµÐ½Ð¾!';
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
    if (!confirm('ÐÑÐ¸ÑÑÐ¸ÑÑ ÐºÐ¾ÑÐ·Ð¸Ð½Ñ?')) return;
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
        container.innerHTML = '<p style="color: #9ca3af;">ÐÐ¾ÑÐ·Ð¸Ð½Ð° Ð¿ÑÑÑÐ°</p>';
        totalSpan.textContent = '0 â½';
        return;
    }
    let html = '';
    cart.forEach(item => {
        const categoryLabel = item.category === '3d-models' ? 'ð² 3D' : 'ð¨ Ð¢ÐµÐºÑÑÑÑÐ°';
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-category">${categoryLabel}</span>
                    <span class="cart-item-price">${item.price} â½</span>
                </div>
                <div class="cart-item-qty">
                    <button onclick="updateQuantity(${item.id}, -1)">â</button>
                    <span class="qty-num">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">â</button>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    totalSpan.textContent = getCartTotal().toLocaleString() + ' â½';
}

function checkout() {
    if (cart.length === 0) {
        alert('ÐÐ¾ÑÐ·Ð¸Ð½Ð° Ð¿ÑÑÑÐ°!');
        return;
    }
    const total = getCartTotal();
    const items = cart.map(i => `- ${i.name} Ã ${i.quantity}`).join('\n');
    alert(`ð³ ÐÐµÑÐµÑÐ¾Ð´ Ðº Ð¾Ð¿Ð»Ð°ÑÐµ Ð½Ð° ÑÑÐ¼Ð¼Ñ ${total} â½\n\nÐ¢Ð¾Ð²Ð°ÑÑ:\n${items}`);
    cart = [];
    saveCart();
    updateCartUI();
    renderCartModal();
    document.getElementById('cartModal').classList.remove('active');
}

// ====== ÐÐÐÐ¦ÐÐÐÐÐÐÐ¦ÐÐ¯ ======
document.addEventListener('DOMContentLoaded', function() {
    console.log(`ð ÐÐ¸ÑÑÐ¸Ð½Ð° v${VERSION} Ð·Ð°Ð³ÑÑÐ¶Ð°ÐµÑÑÑ...`);
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
        console.log('ð ÐÐ°Ð½Ð½ÑÐµ Ð¾Ð±Ð½Ð¾Ð²Ð»ÐµÐ½Ñ');
    });
    document.getElementById('debugResetBtn').addEventListener('click', resetData);
    console.log(`â ÐÐ¸ÑÑÐ¸Ð½Ð° v${VERSION} Ð·Ð°Ð³ÑÑÐ¶ÐµÐ½Ð°. Ð¢Ð¾Ð²Ð°ÑÐ¾Ð²: ${products.length}`);
    products.forEach((p, i) => {
        console.log(`ð¸ [${i+1}] "${p.name}" â image: ${p.image ? 'ÐÐ¡Ð¢Ð¬' : 'ÐÐÐ¢'}`);
    });
});
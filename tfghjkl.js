// ====== ДАННЫЕ (стартовые товары) ======
let products = [
    {
        id: 1,
        name: 'Sci-Fi Rifle',
        price: 1490,
        desc: 'Высокополигональная модель. Форматы: FBX, OBJ. 4K текстуры.',
        image: 'https://images.pexels.com/photos/4250273/pexels-photo-4250273.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
        id: 2,
        name: 'Low Poly House',
        price: 890,
        desc: 'Оптимизированная модель для игр. 1.2K полигонов, 2K текстуры.',
        image: 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
        id: 3,
        name: 'Character Base',
        price: 2450,
        desc: 'Готовая к анимации модель человека. Rigged, 5 текстурных наборов.',
        image: 'https://images.pexels.com/photos/7216975/pexels-photo-7216975.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
];

let cart = [];

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
    
    if (savedCart) {
        try {
            const parsed = JSON.parse(savedCart);
            if (Array.isArray(parsed)) {
                cart = parsed;
            }
        } catch (e) {}
    }
}

function saveData() {
    localStorage.setItem('3dshop_products', JSON.stringify(products));
    localStorage.setItem('3dshop_cart', JSON.stringify(cart));
}

// ====== ОТОБРАЖЕНИЕ ТОВАРОВ ======
function renderProducts() {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    if (products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #6b7280; padding: 40px 0;">Нет товаров. Добавьте их через форму ниже.</p>';
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <img src="${product.image || 'https://placehold.co/400x200/1a1a22/6b7280?text=No+Image'}" alt="${product.name}" 
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
            quantity: 1
        });
    }
    
    saveData();
    updateCartUI();
    
    // Короткая анимация — показываем уведомление
    const btn = document.querySelector(`.buy-btn[data-id="${productId}"]`);
    if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✅ Добавлено!';
        btn.style.background = '#34d399';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 1200);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveData();
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
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <span class="cart-item-name">${item.name}</span>
                    <span class="cart-item-price">${item.price} ₽ × ${item.quantity}</span>
                </div>
                <button class="remove-item" data-id="${item.id}">✕ Удалить</button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    totalSpan.textContent = getCartTotal().toLocaleString() + ' ₽';
    
    // Обработчики на удаление
    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.addEventListener('click', function() {
            removeFromCart(parseInt(this.dataset.id));
        });
    });
}

// ====== ОПЛАТА ЧЕРЕЗ STRIPE (симуляция) ======
function initCheckout() {
    if (cart.length === 0) {
        alert('Корзина пуста! Добавьте товары.');
        return;
    }
    
    const total = getCartTotal();
    
    // ВАЖНО: это демо. В реальном проекте вы должны отправить запрос на ваш сервер,
    // который создаст Stripe-сессию. Здесь мы просто показываем симуляцию.
    alert(`💳 Переход к оплате на сумму ${total} ₽\n\nВ реальном проекте здесь будет подключение к Stripe API.\n\nТовары в корзине:\n${cart.map(i => `- ${i.name} × ${i.quantity}`).join('\n')}`);
    
    // Очистка корзины после оплаты (в демо)
    cart = [];
    saveData();
    updateCartUI();
    renderCartModal();
    renderProducts();
}

// ====== ДОБАВЛЕНИЕ НОВОГО ТОВАРА (админ) ======
function addNewProduct() {
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const descInput = document.getElementById('productDesc');
    const imageInput = document.getElementById('productImage');
    
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value.trim());
    const desc = descInput.value.trim();
    const image = imageInput.value.trim();
    
    if (!name || isNaN(price) || price <= 0) {
        alert('Введите название и корректную цену (число больше 0)');
        return;
    }
    
    const newProduct = {
        id: Date.now(), // уникальный ID на основе времени
        name: name,
        price: price,
        desc: desc || 'Без описания',
        image: image || 'https://placehold.co/400x200/1a1a22/6b7280?text=3D+Model'
    };
    
    products.push(newProduct);
    saveData();
    renderProducts();
    
    // Очистка формы
    nameInput.value = '';
    priceInput.value = '';
    descInput.value = '';
    imageInput.value = '';
    
    alert('✅ Товар добавлен!');
}

// ====== ИНИЦИАЛИЗАЦИЯ ======
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderProducts();
    updateCartUI();
    renderCartModal();
    
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
    
    // Кнопка оплаты
    document.getElementById('checkoutBtn').addEventListener('click', initCheckout);
    
    // Добавление товара
    document.getElementById('addProductBtn').addEventListener('click', addNewProduct);
});

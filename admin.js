// ====== КОНФИГ ======
const ADMIN_PASSWORD = '123456'; // СМЕНИТЕ НА СВОЙ ПАРОЛЬ!

// ====== ДАННЫЕ ======
let products = [];

// ====== ЗАГРУЗКА ДАННЫХ ======
function loadProducts() {
    const saved = localStorage.getItem('3dshop_products');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                products = parsed;
                return;
            }
        } catch (e) {}
    }
    // Стартовые товары, если ничего нет
    products = [
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
    saveProducts();
}

function saveProducts() {
    localStorage.setItem('3dshop_products', JSON.stringify(products));
}

// ====== РЕНДЕР СПИСКА ТОВАРОВ ======
function renderProductsList() {
    const container = document.getElementById('productsListContainer');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-products">📭 Нет товаров. Добавьте первый!</div>';
        return;
    }
    
    let html = '';
    products.forEach((product, index) => {
        html += `
            <div class="product-row" data-index="${index}">
                <img class="thumb" src="${product.image || 'https://placehold.co/60x60/1a1a22/6b7280?text=No'}" 
                     onerror="this.src='https://placehold.co/60x60/1a1a22/6b7280?text=No'" 
                     alt="${product.name}">
                <div class="info">
                    <div class="name">${product.name}</div>
                    <div class="desc">${product.desc || 'Без описания'}</div>
                    <div class="price">${product.price.toLocaleString()} ₽</div>
                </div>
                <div class="actions">
                    <button class="delete-btn" data-id="${product.id}">🗑️ Удалить</button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Обработчики удаления
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            deleteProduct(id);
        });
    });
}

// ====== УДАЛЕНИЕ ТОВАРА ======
function deleteProduct(id) {
    if (!confirm('Удалить этот товар?')) return;
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProductsList();
}

// ====== ДОБАВЛЕНИЕ ТОВАРА ======
function addProduct(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const descInput = document.getElementById('productDesc');
    const fileInput = document.getElementById('fileInput');
    
    const name = nameInput.value.trim();
    const price = parseFloat(priceInput.value.trim());
    const desc = descInput.value.trim();
    
    if (!name || isNaN(price) || price <= 0) {
        alert('Введите название и корректную цену (число > 0)');
        return;
    }
    
    // Обработка изображения
    let imageUrl = 'https://placehold.co/400x200/1a1a22/6b7280?text=3D+Model';
    
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = function(e) {
            imageUrl = e.target.result;
            saveProductToStore(name, price, desc, imageUrl);
        };
        reader.readAsDataURL(file);
    } else {
        // Если файл не выбран, используем ссылку из текстового поля (можно было бы добавить отдельное поле)
        // Но для простоты — плейсхолдер
        saveProductToStore(name, price, desc, imageUrl);
    }
}

function saveProductToStore(name, price, desc, imageUrl) {
    const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        desc: desc || 'Без описания',
        image: imageUrl
    };
    
    products.push(newProduct);
    saveProducts();
    renderProductsList();
    
    // Очистка формы
    document.getElementById('addProductForm').reset();
    document.getElementById('fileName').textContent = 'файл не выбран';
    document.getElementById('previewContainer').innerHTML = '<span class="no-image">🖼️ Предпросмотр появится здесь</span>';
    
    alert('✅ Товар успешно добавлен!');
}

// ====== ПРЕДПРОСМОТР ИЗОБРАЖЕНИЯ ======
function handleFileSelect(e) {
    const file = e.target.files[0];
    const fileNameSpan = document.getElementById('fileName');
    const previewContainer = document.getElementById('previewContainer');
    
    if (!file) {
        fileNameSpan.textContent = 'файл не выбран';
        previewContainer.innerHTML = '<span class="no-image">🖼️ Предпросмотр появится здесь</span>';
        return;
    }
    
    fileNameSpan.textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        previewContainer.innerHTML = `
            <img src="${e.target.result}" alt="Предпросмотр">
            <span style="color: #6b7280; font-size: 14px;">${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
        `;
    };
    reader.readAsDataURL(file);
}

// ====== АВТОРИЗАЦИЯ ======
function handleLogin() {
    const passwordInput = document.getElementById('adminPassword');
    const errorDiv = document.getElementById('loginError');
    
    if (passwordInput.value === ADMIN_PASSWORD) {
        document.getElementById('loginOverlay').classList.add('hidden');
        document.getElementById('adminContent').style.display = 'block';
        errorDiv.style.display = 'none';
        loadProducts();
        renderProductsList();
    } else {
        errorDiv.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

function handleLogout() {
    if (!confirm('Выйти из админки?')) return;
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('adminContent').style.display = 'none';
    document.getElementById('adminPassword').value = '';
}

// ====== ИНИЦИАЛИЗАЦИЯ ======
document.addEventListener('DOMContentLoaded', function() {
    // Проверяем, есть ли уже товары для отображения в списке (если пользователь уже авторизован)
    // По умолчанию показываем экран входа
    
    // Вход
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('adminPassword').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') handleLogin();
    });
    
    // Выход
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    
    // Форма добавления
    document.getElementById('addProductForm').addEventListener('submit', addProduct);
    
    // Предпросмотр файла
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
});
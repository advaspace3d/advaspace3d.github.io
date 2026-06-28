// ... внутри функции loadData(), после строки "// Если нет данных, создаем демо"
    console.log('🔄 Создаем демо-данные...');
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
        }
    ];
    saveProducts();
    console.log('✅ Демо-данные созданы и сохранены');
// ... остальной код
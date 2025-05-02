// Function to initialize category page
function initializeCategoryPage() {
    // Get category from URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryId = urlParams.get('category');

    if (!categoryId) {
        window.location.href = 'index.html';
        return;
    }

    // Get category info
    const category = productsData.categories.find(cat => cat.id === categoryId);
    if (!category) {
        window.location.href = 'index.html';
        return;
    }

    // Update category info
    const categoryInfo = document.getElementById('category-info');
    categoryInfo.innerHTML = `
        <img src="${category.icon}" alt="${category.name}">
        <h1>${category.name}</h1>
        <p>${category.description}</p>
    `;

    // Get products for this category
    const categoryProducts = productsData.products.filter(product => product.category === categoryId);

    // Render products
    const productsContainer = document.getElementById('products-container');
    productsContainer.innerHTML = ''; // Clear existing products

    if (categoryProducts.length === 0) {
        productsContainer.innerHTML = `
            <div class="no-products">
                <h2>Nenhum produto encontrado nesta categoria</h2>
                <p>Em breve novos produtos serão adicionados.</p>
            </div>
        `;
        return;
    }

    categoryProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <p class="product-price">R$ ${product.price.toFixed(2)}</p>
                <div class="product-actions">
                    <a href="${product.buyLink}" class="product-link" target="_blank">
                        <i class="ti ti-brand-whatsapp"></i>
                        Comprar
                    </a>
                    <a href="${product.discordLink}" class="product-link discord" target="_blank">
                        <i class="ti ti-brand-discord"></i>
                        Discord
                    </a>
                </div>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });
}

// Wait for data to be loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if data is already loaded
    if (productsData.categories.length > 0) {
        initializeCategoryPage();
    } else {
        // Create a loading indicator
        const container = document.querySelector('.products-container');
        if (container) {
            container.innerHTML = '<div class="loading">Carregando produtos...</div>';
        }

        // Wait for data to be loaded
        const checkData = setInterval(() => {
            if (productsData.categories.length > 0) {
                clearInterval(checkData);
                initializeCategoryPage();
            }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
            clearInterval(checkData);
            if (productsData.categories.length === 0) {
                window.location.href = 'index.html';
            }
        }, 5000);
    }
}); 
document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // Get product info
    const product = productsData.products.find(prod => prod.id === productId);
    if (!product) {
        window.location.href = 'index.html';
        return;
    }

    // Set active nav item based on product category
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('href')?.includes(product.category)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Update page title
    document.title = `Superloot - ${product.name}`;

    // Render product details
    const productContent = document.getElementById('product-content');
    productContent.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="product-info">
            <h1>${product.name}</h1>
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
}); 
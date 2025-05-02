// Products data
let productsData = {
    categories: [],
    products: []
};

// Function to load products data
async function loadProductsData() {
    try {
        // Try to load from JSON file first
        const response = await fetch('src/data/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        
        // Validate the JSON structure
        if (jsonData.categories && jsonData.products) {
            productsData = jsonData;
            console.log('Products data loaded successfully from JSON file');
            
            // Save to localStorage for offline use
            try {
                localStorage.setItem('superLootData', JSON.stringify(productsData));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
            
            createNavigation();
            initializePage();
            return;
        } else {
            throw new Error('Invalid JSON structure: missing categories or products');
        }
    } catch (e) {
        console.error('Error loading from JSON file:', e);
        
        // If JSON file fails, try to load from localStorage as fallback
        const localData = localStorage.getItem('superLootData');
        if (localData) {
            try {
                const parsedData = JSON.parse(localData);
                if (parsedData.categories && parsedData.products) {
                    productsData = parsedData;
                    console.log('Loaded data from localStorage as fallback');
                    createNavigation();
                    initializePage();
                    return;
                }
            } catch (e) {
                console.error('Error parsing localStorage data:', e);
                localStorage.removeItem('superLootData');
            }
        }
        
        // If both JSON and localStorage fail, show error
        console.error('Failed to load products data from both JSON file and localStorage');
    }
}

// Function to create dynamic navigation
function createNavigation() {
    const navContainer = document.querySelector('.main-nav');
    if (!navContainer) return;

    // Clear existing navigation
    navContainer.innerHTML = '';

    // Add Home link
    const homeLink = document.createElement('a');
    homeLink.href = 'index.html';
    homeLink.className = 'nav-item';
    homeLink.textContent = 'Home';
    navContainer.appendChild(homeLink);

    // Add category links
    productsData.categories.forEach(category => {
        const categoryLink = document.createElement('a');
        categoryLink.href = `category.html?category=${category.id}`;
        categoryLink.className = 'nav-item';
        categoryLink.innerHTML = `
            <img src="${category.icon}" alt="${category.name}">
            <span>${category.name}</span>
        `;
        navContainer.appendChild(categoryLink);
    });

    // Add Discord button
    const discordLink = document.createElement('a');
    discordLink.href = 'https://discord.gg/uw7BbzMwHc';
    discordLink.className = 'nav-item discord';
    discordLink.target = '_blank';
    discordLink.innerHTML = `
        <i class="ti ti-brand-discord"></i>
        <span>Discord</span>
    `;
    navContainer.appendChild(discordLink);

    // Set active state based on current page
    const currentPath = window.location.pathname;
    const currentCategory = new URLSearchParams(window.location.search).get('category');
    
    navContainer.querySelectorAll('.nav-item').forEach(item => {
        if (currentPath.includes('index.html') && item.textContent === 'Home') {
            item.classList.add('active');
        } else if (currentPath.includes('category.html') && item.getAttribute('href')?.includes(currentCategory)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Function to initialize the page
function initializePage() {
    try {
        console.log('Initializing page...');
        
        // Get featured items container
        const featuredItemsContainer = document.getElementById('featured-items');
        if (!featuredItemsContainer) {
            return; // Skip if not on index page
        }
        console.log('Found featured items container');

        // Clear existing items
        featuredItemsContainer.innerHTML = '';

        // Get highlighted products (up to 4)
        const highlightedProducts = productsData.products
            .filter(product => product.highlight)
            .slice(0, 4);
        
        console.log('Highlighted products:', highlightedProducts);

        // If we have less than 4 highlighted products, fill with non-highlighted ones
        if (highlightedProducts.length < 4) {
            const remainingSlots = 4 - highlightedProducts.length;
            const nonHighlightedProducts = productsData.products
                .filter(product => !product.highlight)
                .slice(0, remainingSlots);
            highlightedProducts.push(...nonHighlightedProducts);
        }

        // Render featured items
        highlightedProducts.forEach(product => {
            const featuredItem = document.createElement('div');
            featuredItem.className = 'featured-item';
            featuredItem.innerHTML = `
                <div class="item-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="item-info">
                    <h3>${product.name}</h3>
                    <p class="price">R$ ${product.price.toFixed(2)}</p>
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
            featuredItemsContainer.appendChild(featuredItem);
            console.log('Added featured item:', product.name);
        });
    } catch (error) {
        console.error('Error initializing page:', error);
    }
}

// Initialize FAQ functionality
function initializeFAQ() {
    const faqList = document.querySelector('.faq-list');
    if (!faqList) return;

    const faqData = [
        {
            question: "Como funciona o sistema de pagamento?",
            answer: "Aceitamos pagamentos via cartão de crédito/débito e Pix. Todas as transações são seguras e processadas por nossos parceiros de pagamento."
        },
        {
            question: "Quanto tempo leva para receber meus itens?",
            answer: "Em média, entregamos suas currencies e itens em até 15 minutos após a confirmação do pagamento."
        },
        {
            question: "Os itens são seguros?",
            answer: "Sim, todos os itens são obtidos de forma legítima e segura, seguindo as políticas dos jogos."
        },
        {
            question: "Posso devolver um item?",
            answer: "Sim, aceitamos devoluções em até 7 dias após a compra, desde que o item não tenha sido utilizado."
        }
    ];

    // Clear existing FAQ items
    faqList.innerHTML = '';

    // Add FAQ items dynamically
    faqData.forEach((item, index) => {
        const faqItem = document.createElement('div');
        faqItem.className = 'faq-item';
        faqItem.innerHTML = `
            <div class="faq-question">
                <h3>${item.question}</h3>
                <button class="faq-toggle" aria-expanded="false" aria-controls="faq-answer-${index}">
                    <i class="ti ti-chevron-down"></i>
                </button>
            </div>
            <div id="faq-answer-${index}" class="faq-answer" aria-hidden="true">
                <p>${item.answer}</p>
            </div>
        `;
        faqList.appendChild(faqItem);

        // Add click event to question
        const question = faqItem.querySelector('.faq-question');
        const toggle = question.querySelector('.faq-toggle');
        
        question.addEventListener('click', (e) => {
            // Don't trigger if clicking on the toggle button (it has its own handler)
            if (e.target.closest('.faq-toggle')) return;
            toggleFAQ(faqItem, toggle);
        });

        // Add click event to toggle button
        toggle.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent question click handler from firing
            toggleFAQ(faqItem, toggle);
        });
    });
}

// Function to toggle FAQ items
function toggleFAQ(faqItem, toggle) {
    const isOpen = faqItem.classList.contains('active');
    const answer = faqItem.querySelector('.faq-answer');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
            const itemToggle = item.querySelector('.faq-toggle');
            const itemAnswer = item.querySelector('.faq-answer');
            itemToggle.setAttribute('aria-expanded', 'false');
            itemAnswer.setAttribute('aria-hidden', 'true');
        }
    });

    // Toggle current FAQ item
    faqItem.classList.toggle('active');
    toggle.setAttribute('aria-expanded', !isOpen);
    answer.setAttribute('aria-hidden', isOpen);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    loadProductsData();
    initializeFAQ();
}); 
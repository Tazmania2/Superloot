// Admin functionality
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin page loaded');

    // Try to load from JSON file first
    try {
        const response = await fetch('src/data/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonData = await response.json();
        
        // Validate the JSON structure
        if (jsonData.categories && jsonData.products) {
            productsData = jsonData;
            console.log('Loaded data from JSON file');
            // Save to localStorage for offline editing
            localStorage.setItem('superLootData', JSON.stringify(productsData));
        } else {
            throw new Error('Invalid JSON structure: missing categories or products');
        }
    } catch (e) {
        console.error('Error loading from JSON file:', e);
        
        // If JSON file fails, try to load from localStorage as fallback
        let localData = localStorage.getItem('superLootData');
        if (localData) {
            try {
                const parsedData = JSON.parse(localData);
                if (parsedData.categories && parsedData.products) {
                    productsData = parsedData;
                    console.log('Loaded data from localStorage as fallback');
                } else {
                    throw new Error('Invalid data structure in localStorage');
                }
            } catch (e) {
                console.error('Error loading from localStorage:', e);
                localStorage.removeItem('superLootData');
                // Show error message
                const errorContainer = document.createElement('div');
                errorContainer.className = 'error-message';
                errorContainer.innerHTML = `
                    <p>Erro ao carregar os dados: ${e.message}</p>
                    <p>Por favor, verifique se o arquivo products.json existe e tem a estrutura correta.</p>
                `;
                document.querySelector('.admin-container').prepend(errorContainer);
            }
        }
    }
    
    console.log('Products Data:', productsData);

    // DOM Elements
    const categoriesList = document.getElementById('categories-list');
    const productsList = document.getElementById('products-list');
    const categoryModal = document.getElementById('category-modal');
    const productModal = document.getElementById('product-modal');
    const categoryForm = document.getElementById('category-form');
    const productForm = document.getElementById('product-form');
    const productCategorySelect = document.getElementById('product-category');
    const publishBtn = document.getElementById('publish-btn');

    console.log('DOM Elements:', {
        categoriesList,
        productsList,
        categoryModal,
        productModal,
        categoryForm,
        productForm,
        productCategorySelect
    });

    // Buttons
    const addCategoryBtn = document.getElementById('add-category-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const closeCategoryModal = document.getElementById('close-category-modal');
    const closeProductModal = document.getElementById('close-product-modal');
    const cancelCategory = document.getElementById('cancel-category');
    const cancelProduct = document.getElementById('cancel-product');

    // Modal titles
    const categoryModalTitle = document.getElementById('category-modal-title');
    const productModalTitle = document.getElementById('product-modal-title');

    // Current editing items
    let currentEditingCategory = null;
    let currentEditingProduct = null;

    // Load initial data
    loadCategories();
    loadProducts();

    // Event Listeners
    addCategoryBtn.addEventListener('click', () => openCategoryModal());
    addProductBtn.addEventListener('click', () => openProductModal());
    closeCategoryModal.addEventListener('click', () => closeModal(categoryModal));
    closeProductModal.addEventListener('click', () => closeModal(productModal));
    cancelCategory.addEventListener('click', () => closeModal(categoryModal));
    cancelProduct.addEventListener('click', () => closeModal(productModal));
    publishBtn.addEventListener('click', publishChanges);

    // Category Form Submit
    categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(categoryForm);
        const categoryData = Object.fromEntries(formData.entries());

        if (currentEditingCategory) {
            updateCategory(currentEditingCategory, categoryData);
        } else {
            addCategory(categoryData);
        }

        closeModal(categoryModal);
    });

    // Product Form Submit
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(productForm);
        const productData = Object.fromEntries(formData.entries());
        
        // Convert price to number and get highlight status
        productData.price = parseFloat(productData.price);
        productData.highlight = document.getElementById('product-highlight').checked;

        if (currentEditingProduct) {
            updateProduct(currentEditingProduct, productData);
        } else {
            addProduct(productData);
        }

        closeModal(productModal);
    });

    // Function to save data to localStorage
    function saveToLocalStorage() {
        try {
            localStorage.setItem('superLootData', JSON.stringify(productsData));
            console.log('Saved to localStorage');
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    }

    // Add reset button to header
    const resetBtn = document.createElement('button');
    resetBtn.className = 'admin-button reset';
    resetBtn.innerHTML = '<i class="ti ti-refresh"></i> Resetar Alterações';
    resetBtn.style.marginLeft = '1rem';
    resetBtn.onclick = function() {
        if (confirm('Tem certeza que deseja descartar todas as alterações não publicadas?')) {
            localStorage.removeItem('superLootData');
            location.reload();
        }
    };
    publishBtn.parentNode.insertBefore(resetBtn, publishBtn.nextSibling);

    // Add GitHub push button
    const githubPushBtn = document.createElement('button');
    githubPushBtn.className = 'admin-button github';
    githubPushBtn.innerHTML = '<i class="ti ti-brand-github"></i> Push para GitHub';
    githubPushBtn.style.marginLeft = '1rem';
    githubPushBtn.onclick = async function() {
        try {
            // Get token from window object
            const token = window.GITHUB_TOKEN;
            console.log('Token available:', !!token); // Debug log
            
            if (!token) {
                alert('Token não encontrado. Verifique se o token está configurado corretamente.');
                return;
            }

            // Show loading state
            githubPushBtn.disabled = true;
            githubPushBtn.innerHTML = '<i class="ti ti-loader"></i> Enviando...';

            // Prepare the data
            const jsonData = JSON.stringify(productsData, null, 2);
            const base64Content = btoa(jsonData);
            
            console.log('Iniciando push para GitHub...'); // Debug log
            
            // Get current file SHA (needed for update)
            const getFileResponse = await fetch('https://api.github.com/repos/Tazmania2/Superloot/contents/src/data/products.json', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            let sha;
            if (getFileResponse.ok) {
                const fileData = await getFileResponse.json();
                sha = fileData.sha;
                console.log('SHA obtido com sucesso:', sha); // Debug log
            } else {
                console.error('Erro ao obter SHA:', await getFileResponse.text()); // Debug log
            }

            // Push to GitHub
            const response = await fetch('https://api.github.com/repos/Tazmania2/Superloot/contents/src/data/products.json', {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Atualização automática do products.json',
                    content: base64Content,
                    sha: sha // Will be undefined for new files
                })
            });

            if (response.ok) {
                console.log('Push realizado com sucesso!'); // Debug log
                alert('Arquivo atualizado com sucesso no GitHub!');
                // Force reload the page to get fresh data
                window.location.reload();
            } else {
                const error = await response.json();
                console.error('Erro no push:', error); // Debug log
                throw new Error(error.message || 'Erro ao enviar para o GitHub');
            }
        } catch (error) {
            console.error('Error pushing to GitHub:', error);
            alert('Erro ao enviar para o GitHub: ' + error.message);
        } finally {
            // Reset button state
            githubPushBtn.disabled = false;
            githubPushBtn.innerHTML = '<i class="ti ti-brand-github"></i> Push para GitHub';
        }
    };
    publishBtn.parentNode.insertBefore(githubPushBtn, publishBtn.nextSibling);

    // Functions
    function loadCategories() {
        categoriesList.innerHTML = '';
        productsData.categories.forEach(category => {
            const row = createCategoryRow(category);
            categoriesList.appendChild(row);
        });
        updateProductCategorySelect();
    }

    function loadProducts() {
        productsList.innerHTML = '';
        productsData.products.forEach(product => {
            const row = createProductRow(product);
            productsList.appendChild(row);
        });
    }

    function createCategoryRow(category) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td><img src="${category.icon}" alt="${category.name}" style="width: 24px; height: 24px;"></td>
            <td>${category.description}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-button edit" onclick="editCategory('${category.id}')">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="action-button delete" onclick="deleteCategory('${category.id}')">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    function createProductRow(product) {
        const category = productsData.categories.find(c => c.id === product.category);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${category ? category.name : 'N/A'}</td>
            <td>R$ ${product.price.toFixed(2)}</td>
            <td><img src="${product.image}" alt="${product.name}" style="width: 24px; height: 24px;"></td>
            <td>
                <label class="toggle-switch">
                    <input type="checkbox" ${product.highlight ? 'checked' : ''} 
                           onchange="toggleHighlight('${product.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-button edit" onclick="editProduct('${product.id}')">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button class="action-button delete" onclick="deleteProduct('${product.id}')">
                        <i class="ti ti-trash"></i>
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    function updateProductCategorySelect() {
        productCategorySelect.innerHTML = '';
        productsData.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            productCategorySelect.appendChild(option);
        });
    }

    function openCategoryModal(category = null) {
        currentEditingCategory = category;
        categoryModalTitle.textContent = category ? 'Editar Categoria' : 'Nova Categoria';
        
        if (category) {
            document.getElementById('category-id').value = category.id;
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-icon').value = category.icon;
            document.getElementById('category-description').value = category.description;
        } else {
            categoryForm.reset();
        }

        categoryModal.classList.add('active');
    }

    function openProductModal(product = null) {
        currentEditingProduct = product;
        productModalTitle.textContent = product ? 'Editar Produto' : 'Novo Produto';
        
        if (product) {
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-category').value = product.category;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-image').value = product.image;
            document.getElementById('product-description').value = product.description;
            document.getElementById('product-buy-link').value = product.buyLink;
            document.getElementById('product-discord-link').value = product.discordLink;
            document.getElementById('product-highlight').checked = product.highlight;
        } else {
            productForm.reset();
        }

        productModal.classList.add('active');
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        currentEditingCategory = null;
        currentEditingProduct = null;
    }

    function addCategory(categoryData) {
        productsData.categories.push(categoryData);
        loadCategories();
        saveToLocalStorage();
    }

    function updateCategory(categoryId, categoryData) {
        const index = productsData.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            productsData.categories[index] = categoryData;
            loadCategories();
            saveToLocalStorage();
        }
    }

    function deleteCategory(categoryId) {
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
            productsData.categories = productsData.categories.filter(c => c.id !== categoryId);
            loadCategories();
            saveToLocalStorage();
        }
    }

    function addProduct(productData) {
        productsData.products.push(productData);
        loadProducts();
        saveToLocalStorage();
    }

    function updateProduct(productId, productData) {
        const index = productsData.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            productsData.products[index] = productData;
            loadProducts();
            saveToLocalStorage();
        }
    }

    function deleteProduct(productId) {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            productsData.products = productsData.products.filter(p => p.id !== productId);
            loadProducts();
            saveToLocalStorage();
        }
    }

    function toggleHighlight(productId, isHighlighted) {
        const product = productsData.products.find(p => p.id === productId);
        if (product) {
            product.highlight = isHighlighted;
            loadProducts();
            saveToLocalStorage();
        }
    }

    // Make functions available globally
    window.editCategory = (categoryId) => {
        const category = productsData.categories.find(c => c.id === categoryId);
        if (category) {
            openCategoryModal(category);
        }
    };

    window.deleteCategory = deleteCategory;
    window.editProduct = (productId) => {
        const product = productsData.products.find(p => p.id === productId);
        if (product) {
            openProductModal(product);
        }
    };
    window.deleteProduct = deleteProduct;
    window.toggleHighlight = toggleHighlight;
    window.publishChanges = publishChanges;

    function publishChanges() {
        try {
            // Create a blob with the updated JSON data
            const jsonData = JSON.stringify(productsData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products.json';
            
            // Add the link to the document, click it, and remove it
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Show success message
            alert('Arquivo JSON gerado com sucesso! Faça o upload do arquivo para o servidor para aplicar as alterações.');
        } catch (error) {
            console.error('Error publishing changes:', error);
            alert('Erro ao gerar o arquivo JSON: ' + error.message);
        }
    }

    // Add file upload functionality
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    const importBtn = document.createElement('button');
    importBtn.className = 'admin-button import';
    importBtn.innerHTML = '<i class="ti ti-file-import"></i> Importar JSON';
    importBtn.style.marginLeft = '1rem';
    importBtn.onclick = function() {
        fileInput.click();
    };
    publishBtn.parentNode.insertBefore(importBtn, publishBtn);

    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                const newData = JSON.parse(text);
                
                // Validate the JSON structure
                if (newData.categories && newData.products) {
                    if (confirm('Deseja importar este arquivo JSON? Isso substituirá todos os dados atuais.')) {
                        productsData = newData;
                        localStorage.setItem('superLootData', JSON.stringify(productsData));
                        loadCategories();
                        loadProducts();
                        alert('Dados importados com sucesso!');
                    }
                } else {
                    alert('O arquivo JSON não possui a estrutura correta. Deve conter "categories" e "products".');
                }
            } catch (error) {
                alert('Erro ao ler o arquivo JSON: ' + error.message);
            }
        }
    });
}); 
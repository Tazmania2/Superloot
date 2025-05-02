// Admin functionality
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin page loaded');

    // Initialize productsData
    let productsData = {
        categories: [],
        products: []
    };

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
                showError('Erro ao carregar os dados: ' + e.message);
            }
        }
    }

    // DOM Elements
    const categoriesList = document.getElementById('categories-list');
    const productsList = document.getElementById('products-list');
    const categoryModal = document.getElementById('category-modal');
    const productModal = document.getElementById('product-modal');
    const categoryForm = document.getElementById('category-form');
    const productForm = document.getElementById('product-form');
    const productCategorySelect = document.getElementById('product-category');
    const publishBtn = document.getElementById('publish-btn');
    const resetBtn = document.getElementById('reset-btn');
    const githubBtn = document.getElementById('github-btn');

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
    resetBtn.addEventListener('click', resetChanges);
    githubBtn.addEventListener('click', pushToGitHub);

    // Category Form Submit
    categoryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(categoryForm);
        const categoryData = {
            id: formData.get('id') || Date.now().toString(),
            name: formData.get('name'),
            icon: formData.get('icon'),
            description: formData.get('description'),
            order: parseInt(formData.get('position')) || productsData.categories.length + 1
        };

        if (currentEditingCategory) {
            updateCategory(currentEditingCategory.id, categoryData);
        } else {
            addCategory(categoryData);
        }

        closeModal(categoryModal);
    });

    // Product Form Submit
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(productForm);
        const productData = {
            id: formData.get('id') || Date.now().toString(),
            name: formData.get('name'),
            category: formData.get('category'),
            price: formData.get('price'),
            image: formData.get('image'),
            description: formData.get('description'),
            buyLink: formData.get('buyLink'),
            discordLink: formData.get('discordLink'),
            highlight: document.getElementById('product-highlight').checked,
            order: parseInt(formData.get('position')) || productsData.products.length + 1
        };

        if (currentEditingProduct) {
            updateProduct(currentEditingProduct.id, productData);
        } else {
            addProduct(productData);
        }

        closeModal(productModal);
    });

    // Functions
    function loadCategories() {
        categoriesList.innerHTML = '';
        const sortedCategories = [...productsData.categories].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        sortedCategories.forEach((category, index) => {
            const row = document.createElement('tr');
            row.draggable = true;
            row.dataset.id = category.id;
            row.dataset.type = 'category';
            row.dataset.index = index;
            
            row.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('drop', handleDrop);
            row.addEventListener('dragend', handleDragEnd);
            
            row.innerHTML = `
                <td class="handle-cell">
                    <div class="handle">
                        <i class="ti ti-grip-vertical"></i>
                    </div>
                </td>
                <td class="text-cell">${category.id}</td>
                <td class="text-cell">${category.name}</td>
                <td class="icon-cell">
                    <img src="${category.icon}" alt="${category.name}" class="table-icon">
                </td>
                <td class="text-cell">${category.description}</td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="action-button edit" title="Editar" onclick="editCategory('${category.id}')">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="action-button delete" title="Excluir" onclick="deleteCategory('${category.id}')">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            categoriesList.appendChild(row);
        });
        updateProductCategorySelect();
    }

    function loadProducts() {
        productsList.innerHTML = '';
        const sortedProducts = [...productsData.products].sort((a, b) => (a.order || 0) - (b.order || 0));
        
        sortedProducts.forEach((product, index) => {
            const category = productsData.categories.find(c => c.id === product.category);
            const row = document.createElement('tr');
            row.draggable = true;
            row.dataset.id = product.id;
            row.dataset.type = 'product';
            row.dataset.index = index;
            
            row.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('drop', handleDrop);
            row.addEventListener('dragend', handleDragEnd);
            
            row.innerHTML = `
                <td class="handle-cell">
                    <div class="handle">
                        <i class="ti ti-grip-vertical"></i>
                    </div>
                </td>
                <td class="text-cell">${product.id}</td>
                <td class="text-cell">${product.name}</td>
                <td class="text-cell">${category ? category.name : ''}</td>
                <td class="text-cell price">R$ ${parseFloat(product.price || 0).toFixed(2)}</td>
                <td class="icon-cell">
                    <img src="${product.image}" alt="${product.name}" class="table-icon">
                </td>
                <td class="toggle-cell">
                    <label class="toggle-switch">
                        <input type="checkbox" ${product.highlight ? 'checked' : ''} 
                               onchange="toggleHighlight('${product.id}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="action-button edit" title="Editar" onclick="editProduct('${product.id}')">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button class="action-button delete" title="Excluir" onclick="deleteProduct('${product.id}')">
                            <i class="ti ti-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            productsList.appendChild(row);
        });
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

    function saveToLocalStorage() {
        try {
            localStorage.setItem('superLootData', JSON.stringify(productsData));
            console.log('Saved to localStorage');
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            showError('Erro ao salvar alterações: ' + e.message);
        }
    }

    function resetChanges() {
        if (confirm('Tem certeza que deseja descartar todas as alterações não publicadas?')) {
            localStorage.removeItem('superLootData');
            location.reload();
        }
    }

    async function pushToGitHub() {
        try {
            const token = prompt('Por favor, insira seu token de acesso do GitHub:');
            if (!token) {
                alert('Operação cancelada: Token não fornecido');
                return;
            }
            
            githubBtn.disabled = true;
            githubBtn.innerHTML = '<i class="ti ti-loader"></i> Enviando...';
            
            const jsonData = JSON.stringify(productsData, null, 2);
            const base64Content = btoa(unescape(encodeURIComponent(jsonData)));
            
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
            }
            
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
                    sha: sha
                })
            });
            
            if (response.ok) {
                alert('Arquivo atualizado com sucesso no GitHub!');
                window.location.reload();
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Erro ao enviar para o GitHub');
            }
        } catch (error) {
            console.error('Error pushing to GitHub:', error);
            showError('Erro ao enviar para o GitHub: ' + error.message);
        } finally {
            githubBtn.disabled = false;
            githubBtn.innerHTML = '<i class="ti ti-brand-github"></i> Push para GitHub';
        }
    }

    function publishChanges() {
        try {
            const jsonData = JSON.stringify(productsData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'products.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            alert('Arquivo JSON gerado com sucesso! Faça o upload do arquivo para o servidor para aplicar as alterações.');
        } catch (error) {
            console.error('Error publishing changes:', error);
            showError('Erro ao gerar o arquivo JSON: ' + error.message);
        }
    }

    function showError(message) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.innerHTML = `
            <p>${message}</p>
            <p>Por favor, verifique se o arquivo products.json existe e tem a estrutura correta.</p>
        `;
        document.querySelector('.admin-container').prepend(errorContainer);
    }

    // Drag and Drop Functions
    let draggedItem = null;
    let draggedItemType = null;

    function handleDragStart(e) {
        // Only allow dragging by the handle
        if (!e.target.closest('.handle')) {
            e.preventDefault();
            return;
        }
        
        draggedItem = e.target.closest('tr');
        draggedItemType = draggedItem.dataset.type;
        draggedItem.classList.add('dragging');
        
        // Required for Firefox
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');

        // Add dragging class to table for visual feedback
        const table = draggedItem.closest('table');
        table.classList.add('dragging-active');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const row = e.target.closest('tr');
        if (!row || row === draggedItem || row.dataset.type !== draggedItemType) return;
        
        // Clear existing drag-over classes
        document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
        
        const rect = row.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        
        // Add visual indicator
        if (e.clientY < midpoint) {
            row.classList.add('drag-over-top');
        } else {
            row.classList.add('drag-over-bottom');
        }
    }

    function handleDrop(e) {
        e.preventDefault();
        
        const row = e.target.closest('tr');
        if (!row || row === draggedItem || row.dataset.type !== draggedItemType) return;
        
        const items = draggedItemType === 'category' ? productsData.categories : productsData.products;
        const draggedIndex = parseInt(draggedItem.dataset.index);
        const dropIndex = parseInt(row.dataset.index);
        
        if (draggedIndex !== dropIndex) {
            const rect = row.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const dropAfter = e.clientY > midpoint;
            
            // Remove the dragged item from its original position
            const [movedItem] = items.splice(draggedIndex, 1);
            
            // Calculate new position
            let newIndex;
            if (dropAfter) {
                newIndex = dropIndex > draggedIndex ? dropIndex : dropIndex + 1;
            } else {
                newIndex = dropIndex < draggedIndex ? dropIndex : dropIndex - 1;
            }
            
            // Insert at new position
            items.splice(newIndex, 0, movedItem);
            
            // Update order values
            items.forEach((item, index) => {
                item.order = index + 1;
            });
            
            // Save changes and reload
            saveToLocalStorage();
            if (draggedItemType === 'category') {
                loadCategories();
            } else {
                loadProducts();
            }
        }
    }

    function handleDragEnd(e) {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            
            // Remove dragging class from table
            const table = draggedItem.closest('table');
            table.classList.remove('dragging-active');
        }
        
        // Clear all drag-over classes
        document.querySelectorAll('.drag-over-top, .drag-over-bottom').forEach(el => {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
        });
        
        draggedItem = null;
        draggedItemType = null;
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
}); 
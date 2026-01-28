/**
 * ============================================
 * SHARED SHOPPING LIST APP - Enhanced Version
 * ============================================
 * 
 * DATA STRUCTURE:
 * ---------------
 * sections = [
 *   {
 *     id: timestamp,
 *     name: "Section Name",
 *     items: [
 *       { id: timestamp, text: "Item", qty: 2, completed: false }
 *     ]
 *   }
 * ]
 * 
 * URL ENCODING:
 * -------------
 * Compact format to minimize URL length:
 * [
 *   { n: "Section", i: [{ t: "Item", q: 2, c: false }] }
 * ]
 * 
 * n = name, i = items, t = text, q = quantity, c = completed
 */

// ============================================
// Recommended Items by Section Type
// ============================================
/**
 * Recommended items are matched by section name keywords.
 * This makes it easy for users to quickly add common items.
 */
const RECOMMENDED_ITEMS = {
    // Articulos personales
    'personales': ['🪥 Cepillo de dientes', '🧴 Shampoo', '🧻 Papel higienico', '🧼 Jabon', '💊 Medicinas', '🪒 Rastrillo', '🧴 Crema', '🦷 Pasta dental'],

    // Frutas y verduras
    'frutas': ['🍎 Manzanas', '🍌 Platanos', '🍊 Naranjas', '🍋 Limones', '🍇 Uvas', '🍓 Fresas', '🥑 Aguacate', '🍉 Sandia', '🥭 Mango', '🍍 Pina'],
    'verduras': ['🥬 Lechuga', '🍅 Tomates', '🥕 Zanahorias', '🥒 Pepino', '🧅 Cebolla', '🧄 Ajo', '🥔 Papas', '🌶️ Chile', '� Brocoli', '� Pimiento'],

    // Carnes, pescados y demas
    'carnes': ['🥩 Carne de res', '🍗 Pollo', '🥓 Tocino', '🌭 Salchichas', '🍖 Cerdo', '🐟 Pescado', '� Camaron', '� Huevos'],
    'pescados': ['🐟 Pescado', '� Camaron', '� Pulpo', '� Langosta', '🐚 Almejas'],

    // Cosas de limpieza
    'limpieza': ['🧹 Escoba', '🧽 Esponjas', '🧴 Jabon liquido', '🧻 Papel de cocina', '🧼 Detergente', '🪣 Trapeador', '� Cloro', '🧴 Suavizante'],

    // Cereales y leches
    'cereales': ['� Cereal', '� Leche', '� Leche deslactosada', '� Granola', '🍯 Avena', '🥛 Leche de almendras'],
    'leches': ['🥛 Leche entera', '🥛 Leche deslactosada', '🥛 Leche de almendras', '🥛 Leche de soya'],

    // Arroz
    'arroz': ['🍚 Arroz blanco', '� Arroz integral', '� Frijoles', '� Lentejas', '🌽 Elote', '� Frijoles de lata'],

    // Especies
    'especies': ['� Sal', '🌶️ Pimienta', '� Ajo en polvo', '� Oregano', '🌿 Cilantro', '🍃 Laurel', '�️ Chile en polvo', '� Cebolla en polvo'],

    // Pan, yogurt, lacteos y jamon
    'pan': ['🍞 Pan blanco', '🥖 Baguette', '🥐 Cuernos', '🍞 Pan integral', '� Tortillas'],
    'yogurt': ['🍦 Yogurt natural', '🍦 Yogurt griego', '🍦 Yogurt de fresa', '🍦 Yogurt bebible'],
    'lacteos': ['� Queso', '� Mantequilla', '🍦 Yogurt', '🍶 Crema', '� Queso crema', '� Queso oaxaca'],
    'jamon': ['🥓 Jamon', '🥓 Jamon de pavo', '� Salchicha', '� Tocino']
};

// Default sections to create on first load
const DEFAULT_SECTIONS = [
    'Articulos personales',
    'Frutas y verduras',
    'Carnes, pescados y demas',
    'Cosas de limpieza',
    'Cereales y leches',
    'Arroz',
    'Especies',
    'Pan, yogurt, lacteos y jamon'
];

/**
 * Get recommended items for a section based on its name.
 * Matches keywords in the section name.
 */
function getRecommendedItems(sectionName) {
    const nameLower = sectionName.toLowerCase();

    for (const [keyword, items] of Object.entries(RECOMMENDED_ITEMS)) {
        if (nameLower.includes(keyword)) {
            return items;
        }
    }

    return [];
}

// ============================================
// DOM Element References
// ============================================
const addSectionForm = document.getElementById('addSectionForm');
const sectionInput = document.getElementById('sectionInput');
const sectionsContainer = document.getElementById('sectionsContainer');
const emptyState = document.getElementById('emptyState');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const sharedIndicator = document.getElementById('sharedIndicator');
const toast = document.getElementById('toast');

// ============================================
// Application State
// ============================================
let sections = [];
let isSharedList = false;
let draggedSection = null;

// ============================================
// URL Encoding/Decoding Functions
// ============================================

function encodeListToBase64(data) {
    // Convert to compact format
    const compact = data.map(section => ({
        n: section.name,
        i: section.items.map(item => ({
            t: item.text,
            q: item.qty,
            c: item.completed
        }))
    }));

    const json = JSON.stringify(compact);
    return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(parseInt(p1, 16))
    ));
}

function decodeBase64ToList(base64) {
    try {
        const json = decodeURIComponent(
            atob(base64).split('').map(c =>
                '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
            ).join('')
        );

        const compact = JSON.parse(json);

        if (!Array.isArray(compact)) return null;

        return compact.map((section, sIndex) => ({
            id: Date.now() + sIndex,
            name: String(section.n || '').trim(),
            items: (section.i || []).map((item, iIndex) => ({
                id: Date.now() + sIndex * 1000 + iIndex,
                text: String(item.t || '').trim(),
                qty: Math.max(1, parseInt(item.q) || 1),
                completed: Boolean(item.c)
            })).filter(item => item.text.length > 0)
        })).filter(section => section.name.length > 0);

    } catch (error) {
        console.error('Failed to decode list from URL:', error);
        return null;
    }
}

function updateURL() {
    if (sections.length === 0) {
        history.replaceState(null, '', window.location.pathname);
    } else {
        const encoded = encodeListToBase64(sections);
        history.replaceState(null, '', '#' + encoded);
    }
}

function loadFromURL() {
    const hash = window.location.hash.slice(1);
    if (!hash) return false;

    const decoded = decodeBase64ToList(hash);
    if (decoded && decoded.length > 0) {
        sections = decoded;
        return true;
    }
    return false;
}

// ============================================
// UI Rendering Functions
// ============================================

function renderSections() {
    sectionsContainer.innerHTML = '';

    // Show/hide empty state
    emptyState.style.display = sections.length === 0 ? 'block' : 'none';

    sections.forEach((section, index) => {
        const sectionEl = createSectionElement(section, index);
        sectionsContainer.appendChild(sectionEl);
    });
}

function createSectionElement(section, index) {
    const div = document.createElement('div');
    div.className = 'section';
    div.dataset.id = section.id;
    div.draggable = true;

    // Calculate counts
    const total = section.items.length;
    const completed = section.items.filter(i => i.completed).length;
    const countText = total === 0 ? 'empty' :
        completed === 0 ? `${total} items` :
            `${completed}/${total} done`;

    // Get recommended items for this section
    const recommended = getRecommendedItems(section.name);
    const existingItems = section.items.map(i => i.text.toLowerCase());

    div.innerHTML = `
        <div class="section-header">
            <span class="section-drag-handle" title="Drag to reorder">⋮⋮</span>
            <span class="section-title">${escapeHtml(section.name)}</span>
            <span class="section-count">${countText}</span>
            <button class="section-delete-btn" data-section-id="${section.id}" title="Delete section">×</button>
        </div>
        <div class="section-content">
            <form class="add-item-form" data-section-id="${section.id}">
                <input type="number" min="1" value="1" class="item-qty-input" aria-label="Quantity">
                <input type="text" placeholder="Add item..." class="item-text-input" autocomplete="off" aria-label="Item name">
                <button type="submit" class="btn btn-primary btn-small">+</button>
            </form>
            ${recommended.length > 0 ? `
                <div class="recommended-items">
                    <div class="recommended-label">Quick add:</div>
                    <div class="recommended-chips">
                        ${recommended.map(item => {
        const isAdded = existingItems.some(existing =>
            existing.includes(item.toLowerCase().replace(/^[^\w]+/, '').trim()) ||
            item.toLowerCase().includes(existing)
        );
        return `<button type="button" class="recommended-chip ${isAdded ? 'added' : ''}" 
                                data-section-id="${section.id}" 
                                data-item="${escapeHtml(item)}">${item}</button>`;
    }).join('')}
                    </div>
                </div>
            ` : ''}
            <ul class="shopping-list" data-section-id="${section.id}">
                ${section.items.map(item => createItemHTML(item, section.id)).join('')}
            </ul>
        </div>
    `;

    // Add drag event listeners
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);

    return div;
}

function createItemHTML(item, sectionId) {
    return `
        <li class="list-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
            <label class="checkbox-wrapper">
                <input type="checkbox" ${item.completed ? 'checked' : ''} 
                    data-section-id="${sectionId}" 
                    data-item-id="${item.id}"
                    aria-label="Mark ${item.text} as complete">
                <span class="checkbox-custom"></span>
            </label>
            <span class="item-quantity">${item.qty}</span>
            <span class="item-text">${escapeHtml(item.text)}</span>
            <button class="delete-btn" 
                data-section-id="${sectionId}" 
                data-item-id="${item.id}"
                aria-label="Delete ${item.text}">×</button>
        </li>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSharedIndicator(show) {
    sharedIndicator.classList.toggle('visible', show);
}

// ============================================
// Drag and Drop for Section Reordering
// ============================================

function handleDragStart(e) {
    draggedSection = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedSection = null;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('drag-over'));
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (this !== draggedSection) {
        this.classList.add('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (draggedSection && this !== draggedSection) {
        const fromId = parseInt(draggedSection.dataset.id);
        const toId = parseInt(this.dataset.id);

        const fromIndex = sections.findIndex(s => s.id === fromId);
        const toIndex = sections.findIndex(s => s.id === toId);

        if (fromIndex !== -1 && toIndex !== -1) {
            const [removed] = sections.splice(fromIndex, 1);
            sections.splice(toIndex, 0, removed);
            renderSections();
            updateURL();
            showToast('Section reordered');
        }
    }
}

// ============================================
// Section Management
// ============================================

function addSection(name) {
    const trimmedName = name.trim();
    if (!trimmedName) {
        showToast('Please enter a section name');
        return;
    }

    const exists = sections.some(s =>
        s.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (exists) {
        showToast('This section already exists');
        return;
    }

    sections.push({
        id: Date.now(),
        name: trimmedName,
        items: []
    });

    renderSections();
    updateURL();
    sectionInput.value = '';
    showToast(`Added "${trimmedName}" section`);
}

function deleteSection(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    if (section.items.length > 0) {
        if (!confirm(`Delete "${section.name}" and all its ${section.items.length} items?`)) {
            return;
        }
    }

    sections = sections.filter(s => s.id !== sectionId);
    renderSections();
    updateURL();
    showToast(`Deleted "${section.name}"`);
}

// ============================================
// Item Management
// ============================================

function addItem(sectionId, text, qty = 1) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const trimmedText = text.trim();
    if (!trimmedText) {
        showToast('Please enter an item name');
        return;
    }

    const exists = section.items.some(i =>
        i.text.toLowerCase() === trimmedText.toLowerCase()
    );

    if (exists) {
        showToast('This item is already in the section');
        return;
    }

    section.items.push({
        id: Date.now(),
        text: trimmedText,
        qty: Math.max(1, parseInt(qty) || 1),
        completed: false
    });

    renderSections();
    updateURL();
}

function toggleItem(sectionId, itemId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const item = section.items.find(i => i.id === itemId);
    if (item) {
        item.completed = !item.completed;
        renderSections();
        updateURL();
    }
}

function deleteItem(sectionId, itemId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    section.items = section.items.filter(i => i.id !== itemId);
    renderSections();
    updateURL();
}

function clearAllCompleted() {
    let totalCleared = 0;

    sections.forEach(section => {
        const before = section.items.length;
        section.items = section.items.filter(i => !i.completed);
        totalCleared += before - section.items.length;
    });

    if (totalCleared === 0) {
        showToast('No completed items to clear');
        return;
    }

    renderSections();
    updateURL();
    showToast(`Cleared ${totalCleared} item${totalCleared !== 1 ? 's' : ''}`);
}

// ============================================
// Sharing Functions
// ============================================

async function copyShareLink() {
    const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

    if (sections.length === 0 || totalItems === 0) {
        showToast('Add some items before sharing');
        return;
    }

    updateURL();

    try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied! Share with family 🎉');
    } catch (error) {
        fallbackCopyToClipboard(window.location.href);
    }
}

function fallbackCopyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        document.execCommand('copy');
        showToast('Link copied! Share with family 🎉');
    } catch (error) {
        showToast('Failed to copy. Try selecting URL manually.');
    }

    document.body.removeChild(textarea);
}

// ============================================
// Toast Notification
// ============================================

let toastTimeout = null;

function showToast(message, duration = 2500) {
    if (toastTimeout) clearTimeout(toastTimeout);

    toast.textContent = message;
    toast.classList.add('visible');

    toastTimeout = setTimeout(() => {
        toast.classList.remove('visible');
    }, duration);
}

// ============================================
// Event Delegation
// ============================================

// Add section form
addSectionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addSection(sectionInput.value);
});

// Sections container events (delegation)
sectionsContainer.addEventListener('submit', (e) => {
    if (e.target.classList.contains('add-item-form')) {
        e.preventDefault();
        const sectionId = parseInt(e.target.dataset.sectionId);
        const textInput = e.target.querySelector('.item-text-input');
        const qtyInput = e.target.querySelector('.item-qty-input');

        addItem(sectionId, textInput.value, qtyInput.value);
        textInput.value = '';
        qtyInput.value = '1';
        textInput.focus();
    }
});

sectionsContainer.addEventListener('click', (e) => {
    // Delete section
    if (e.target.classList.contains('section-delete-btn')) {
        const sectionId = parseInt(e.target.dataset.sectionId);
        deleteSection(sectionId);
        return;
    }

    // Delete item
    if (e.target.classList.contains('delete-btn')) {
        const sectionId = parseInt(e.target.dataset.sectionId);
        const itemId = parseInt(e.target.dataset.itemId);
        deleteItem(sectionId, itemId);
        return;
    }

    // Recommended chip - uses the quantity from the section's qty input
    if (e.target.classList.contains('recommended-chip') && !e.target.classList.contains('added')) {
        const sectionId = parseInt(e.target.dataset.sectionId);
        const itemText = e.target.dataset.item;

        // Find the section's quantity input and get its current value
        const sectionEl = e.target.closest('.section');
        const qtyInput = sectionEl.querySelector('.item-qty-input');
        const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;

        addItem(sectionId, itemText, qty);

        // Reset quantity input to 1 after adding
        if (qtyInput) qtyInput.value = '1';

        return;
    }
});

sectionsContainer.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
        const sectionId = parseInt(e.target.dataset.sectionId);
        const itemId = parseInt(e.target.dataset.itemId);
        toggleItem(sectionId, itemId);
    }
});

// Sticky action buttons
copyLinkBtn.addEventListener('click', copyShareLink);
clearCompletedBtn.addEventListener('click', clearAllCompleted);

// Hash change handler
window.addEventListener('hashchange', () => {
    if (loadFromURL()) {
        isSharedList = true;
        showSharedIndicator(true);
    }
    renderSections();
});

// ============================================
// Initialization
// ============================================

function init() {
    if (loadFromURL()) {
        isSharedList = true;
        showSharedIndicator(true);
        showToast('Shared list loaded! ✨');
    } else {
        // Create default sections on first load
        DEFAULT_SECTIONS.forEach((name, index) => {
            sections.push({
                id: Date.now() + index,
                name: name,
                items: []
            });
        });
    }

    renderSections();
    sectionInput.focus();
}

init();

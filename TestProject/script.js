// --- HTML Elements ---
const infoText = document.getElementById('infoText');
const colorPicker = document.getElementById('colorPicker');
const band = document.getElementById('band');
const customText = document.getElementById('customText');
const textPreview = document.getElementById('textPreview');
const textCount = document.getElementById('textCount');
const watch = document.getElementById('watch');
const watchForm = document.getElementById('watchForm');

const cart = document.getElementById('cart');
const cartTitle = document.getElementById('cartTitle');
const cartSubtitle = document.getElementById('cartSubtitle');
const cartItemsList = document.getElementById('cartItemsList');
const cartIcon = document.getElementById('cartIcon');
const notifications = document.getElementById('notifications');

// Items saved in cart
let cartItems = [];

// --- Helper: Simple Toast Alert ---
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = 'alert-item';

    let icon = 'ℹ️';
    if (type === 'error') icon = '❌';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';

    alert.innerHTML = `<span class="mr-2">${icon}</span> ${message}`;
    notifications.appendChild(alert);

    // Remove notification after 3.5 seconds
    setTimeout(() => {
        alert.classList.add('fade-out');
        alert.addEventListener('animationend', () => alert.remove());
    }, 3500);
}

// --- 1. Prevent Text Copy & Cut ---
function stopCopy(event) {
    event.preventDefault();
    showAlert('Copying text is not allowed.', 'warning');
}

infoText.addEventListener('copy', stopCopy);
infoText.addEventListener('cut', stopCopy);

// --- 2. Change Watch Band Color ---
function updateColor() {
    const chosenOption = colorPicker.options[colorPicker.selectedIndex];
    const newGradient = chosenOption.getAttribute('data-gradient');

    band.style.background = newGradient;
    showAlert(`Color set to ${chosenOption.text}.`, 'info');
}

colorPicker.addEventListener('change', updateColor);

// --- 3. Live Engraving Text & Character Count ---
function updateEngraving() {
    const text = customText.value.toUpperCase();

    // Show text on watch face
    textPreview.textContent = text || 'LUMINA';

    // Update counter
    textCount.textContent = `${text.length} / 12`;

    // Turn counter red if at max limit
    if (text.length === 12) {
        textCount.classList.add('text-red-500');
        textCount.classList.remove('text-slate-500');
    } else {
        textCount.classList.add('text-slate-500');
        textCount.classList.remove('text-red-500');
    }
}

customText.addEventListener('input', updateEngraving);

// --- 4. Mouse Glare Effect ---
function moveGlare(event) {
    const box = watch.getBoundingClientRect();

    // Calculate mouse position inside the watch box
    const x = ((event.clientX - box.left) / box.width) * 100;
    const y = ((event.clientY - box.top) / box.height) * 100;

    watch.style.setProperty('--mouse-x', `${x}%`);
    watch.style.setProperty('--mouse-y', `${y}%`);
}

function startHover() {
    watch.classList.add('hovered');
}

function stopHover() {
    watch.classList.remove('hovered');
    watch.style.setProperty('--mouse-x', '50%');
    watch.style.setProperty('--mouse-y', '50%');
}

watch.addEventListener('mousemove', moveGlare);
watch.addEventListener('mouseenter', startHover);
watch.addEventListener('mouseleave', stopHover);

// --- 5. Add to Cart Functions ---
function addItemToCart() {
    const color = colorPicker.options[colorPicker.selectedIndex].text;
    const text = customText.value.toUpperCase() || 'None';

    cartItems.push({ color: color, text: text, price: 299 });

    // Update Cart Area
    cartTitle.textContent = `Cart (${cartItems.length} items)`;
    cartSubtitle.classList.add('hidden');
    cartItemsList.classList.remove('hidden');

    // Create and add cart row
    const row = document.createElement('li');
    row.className = 'flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg text-sm';
    row.innerHTML = `
        <div>
            <span class="font-semibold text-slate-800">Lumina (${color})</span>
            <div class="text-xs text-slate-500 mt-0.5">Engraving: ${text}</div>
        </div>
        <span class="font-bold text-slate-700">$299</span>
    `;
    cartItemsList.appendChild(row);
}

// --- 6. Drag and Drop to Cart ---
watch.addEventListener('dragstart', (event) => {
    event.dataTransfer.setData('text/plain', 'smartwatch');
    event.dataTransfer.effectAllowed = 'copy';
});

cart.addEventListener('dragover', (event) => {
    event.preventDefault(); // Allows drop
    event.dataTransfer.dropEffect = 'copy';
});

cart.addEventListener('dragenter', (event) => {
    event.preventDefault();
    cart.classList.add('active');
    cartIcon.classList.add('text-brand-500');
    cartIcon.classList.remove('text-slate-300');
});

cart.addEventListener('dragleave', () => {
    cart.classList.remove('active');
    cartIcon.classList.remove('text-brand-500');
    cartIcon.classList.add('text-slate-300');
});

cart.addEventListener('drop', (event) => {
    event.preventDefault();

    cart.classList.remove('active');
    cartIcon.classList.remove('text-brand-500');
    cartIcon.classList.add('text-slate-300');

    const itemData = event.dataTransfer.getData('text/plain');
    if (itemData === 'smartwatch') {
        addItemToCart();
        showAlert('Added watch to your cart!', 'success');
    }
});

// --- 7. Form Submit ---
function handleFormSubmit(event) {
    event.preventDefault();

    if (!colorPicker.value) {
        showAlert('Please pick a band color.', 'error');
        return;
    }

    if (customText.value.length > 12) {
        showAlert('Engraving is too long (max 12 characters).', 'error');
        return;
    }

    showAlert('Order submitted successfully!', 'success');
}

watchForm.addEventListener('submit', handleFormSubmit);

// --- 8. Form Reset ---
function handleFormReset() {
    // Wait for the browser to clear input values first
    setTimeout(() => {
        // Reset watch band back to default black
        const defaultOption = colorPicker.querySelector('option[value="black"]');
        band.style.background = defaultOption.getAttribute('data-gradient');

        // Reset text preview and counter
        textPreview.textContent = 'LUMINA';
        textCount.textContent = '0 / 12';
        textCount.classList.add('text-slate-500');
        textCount.classList.remove('text-red-500');

        // Clear cart
        cartItems = [];
        cartItemsList.innerHTML = '';
        cartItemsList.classList.add('hidden');
        cartTitle.textContent = 'Cart';
        cartSubtitle.classList.remove('hidden');

        showAlert('Reset back to default settings.', 'info');
    }, 0);
}

watchForm.addEventListener('reset', handleFormReset);
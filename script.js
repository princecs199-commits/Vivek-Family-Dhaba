
/* =====================================================
   VIVEK FAMILY DHABA - COMPLETE WEBSITE JAVASCRIPT
   Compatible with the supplied HTML and CSS
   ===================================================== */
(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    // ---------- SETTINGS ----------
    const WHATSAPP_NUMBER = '917024386895';
    const DELIVERY_FEE = 30;
    const CART_STORAGE_KEY = 'vivekDhabaCart';

    const $ = (id) => document.getElementById(id);
    const money = (amount) =>
      `₹${Number(amount || 0).toFixed(2)}`;

    // ---------- ELEMENTS ----------
    const menuToggle = $('menu-toggle');
    const navLinks = $('nav-links');
    const foodGrid = $('food-grid');
    const menuSearch = $('menu-search') || $('food-search');
    const emptySearch = $('empty-search');
    const filterButtons = $('filter-buttons');

    const cartItemsHost = $('cart-items');
    const cartCountElement = $('cart-count');
    const subtotalElement = $('cart-subtotal');
    const deliveryElement = $('delivery-charge');
    const totalElement = $('cart-total');
    const clearCartButton = $('clear-cart');

    const orderForm = $('order-form');
    const orderTypeSelect = $('order-type');
    const paymentMethodSelect = $('payment-method');
    const paymentNote = $('payment-note');
    const orderMessage = $('order-message');

    const addressField =
      $('customer-address') ||
      $('address');

    const yearElement =
      $('footer-year') || $('current-year');

    // ---------- CART STATE ----------
    let cart = loadCart();
    let activeCategory = 'all';

    function loadCart() {
      try {
        const saved = JSON.parse(
          localStorage.getItem(CART_STORAGE_KEY) || '{}'
        );

        if (!saved || typeof saved !== 'object') {
          return {};
        }

        const cleaned = {};

        Object.values(saved).forEach((item) => {
          if (!item || !item.id || !item.name) return;

          const price = Number(item.price);
          const qty = Math.floor(
            Number(item.qty ?? item.quantity)
          );

          if (
            Number.isFinite(price) &&
            price >= 0 &&
            Number.isFinite(qty) &&
            qty > 0
          ) {
            cleaned[String(item.id)] = {
              id: String(item.id),
              name: String(item.name),
              price,
              qty: Math.min(qty, 99)
            };
          }
        });

        return cleaned;
      } catch (error) {
        console.warn('Could not restore cart:', error);
        return {};
      }
    }

    function saveCart() {
      try {
        localStorage.setItem(
          CART_STORAGE_KEY,
          JSON.stringify(cart)
        );
      } catch (error) {
        console.warn('Could not save cart:', error);
      }
    }

    function cartValues() {
      return Object.values(cart);
    }

    function itemCount() {
      return cartValues().reduce(
        (sum, item) => sum + item.qty,
        0
      );
    }

    function subtotal() {
      return cartValues().reduce(
        (sum, item) => sum + item.price * item.qty,
        0
      );
    }

    function selectedOrderType() {
      return orderTypeSelect
        ? orderTypeSelect.value
        : 'delivery';
    }

    function deliveryCharge() {
      return (
        selectedOrderType() === 'delivery' &&
        subtotal() > 0
      )
        ? DELIVERY_FEE
        : 0;
    }

    function updateCart() {
      saveCart();
      renderCart();
    }

    // ---------- CART BUTTONS ----------
    function createCartButton(
      label,
      action,
      id,
      accessibleLabel
    ) {
      const button = document.createElement('button');

      button.type = 'button';
      button.textContent = label;
      button.dataset.cartAction = action;
      button.dataset.id = id;
      button.setAttribute('aria-label', accessibleLabel);

      return button;
    }

    // ---------- DISPLAY CART ----------
    function renderCart() {
      if (!cartItemsHost) return;

      cartItemsHost.replaceChildren();

      const items = cartValues();

      if (items.length === 0) {
        const empty = document.createElement('p');

        empty.className = 'cart-empty';
        empty.textContent =
          'Your cart is empty. Add food from the menu.';

        cartItemsHost.appendChild(empty);
      } else {
        items.forEach((item) => {
          const row = document.createElement('div');
          row.className = 'cart-item';

          const details = document.createElement('div');
          details.className = 'cart-item-details';

          const title = document.createElement('h4');
          title.textContent = item.name;

          const price = document.createElement('p');
          price.textContent =
            `${money(item.price)} each · ` +
            `${item.qty} × ${money(item.price)} = ` +
            `${money(item.price * item.qty)}`;

          const controls = document.createElement('div');
          controls.className = 'cart-item-controls';

          controls.append(
            createCartButton(
              '−',
              'decrease',
              item.id,
              `Decrease ${item.name} quantity`
            )
          );

          const quantity = document.createElement('span');
          quantity.className = 'cart-quantity';
          quantity.textContent = String(item.qty);

          controls.appendChild(quantity);

          controls.append(
            createCartButton(
              '+',
              'increase',
              item.id,
              `Increase ${item.name} quantity`
            ),
            createCartButton(
              'Remove',
              'remove',
              item.id,
              `Remove ${item.name} from cart`
            )
          );

          details.append(title, price, controls);
          row.appendChild(details);
          cartItemsHost.appendChild(row);
        });
      }

      const count = itemCount();
      const sub = subtotal();
      const fee = deliveryCharge();

      if (cartCountElement) {
        cartCountElement.textContent = String(count);
      }

      if (subtotalElement) {
        subtotalElement.textContent = money(sub);
      }

      if (deliveryElement) {
        deliveryElement.textContent = money(fee);
      }

      if (totalElement) {
        totalElement.textContent = money(sub + fee);
      }

      if (clearCartButton) {
        clearCartButton.disabled = count === 0;
      }
    }

    function changeQuantity(id, change) {
      const item = cart[id];

      if (!item) return;

      item.qty += change;

      if (item.qty <= 0) {
        delete cart[id];
      }

      if (item.qty > 99) {
        item.qty = 99;
      }

      updateCart();
    }

    // ---------- ADD TO CART ----------
    if (foodGrid) {
      foodGrid.addEventListener('click', (event) => {
        const button = event.target.closest('.add-to-cart');

        if (!button) return;

        const card = button.closest('.food-card');

        const id = String(
          button.dataset.id ||
          card?.dataset.id ||
          ''
        ).trim();

        const name = String(
          button.dataset.name ||
          card?.dataset.name ||
          card?.querySelector('h3')?.textContent ||
          ''
        ).trim();

        const price = Number(
          button.dataset.price ?? card?.dataset.price
        );

        if (
          !id ||
          !name ||
          !Number.isFinite(price) ||
          price < 0
        ) {
          showMessage(
            'Food details are missing. Check the menu HTML.',
            true
          );
          return;
        }

        if (cart[id]) {
          cart[id].qty = Math.min(
            99,
            cart[id].qty + 1
          );
        } else {
          cart[id] = {
            id,
            name,
            price,
            qty: 1
          };
        }

        updateCart();

        const originalText =
          button.textContent.trim() || 'Add to Cart';

        button.textContent = 'Added ✓';
        button.disabled = true;

        window.setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 750);
      });
    }

    // ---------- CART QUANTITY CONTROLS ----------
    if (cartItemsHost) {
      cartItemsHost.addEventListener('click', (event) => {
        const button = event.target.closest(
          '[data-cart-action]'
        );

        if (!button) return;

        const id = button.dataset.id;
        const action = button.dataset.cartAction;

        if (!id || !cart[id]) return;

        if (action === 'increase') {
          changeQuantity(id, 1);
        } else if (action === 'decrease') {
          changeQuantity(id, -1);
        } else if (action === 'remove') {
          delete cart[id];
          updateCart();
        }
      });
    }

    // ---------- CLEAR CART ----------
    if (clearCartButton) {
      clearCartButton.addEventListener('click', () => {
        if (itemCount() === 0) return;

        cart = {};
        updateCart();

        showMessage(
          'Your cart has been cleared.',
          false
        );
      });
    }

    // ---------- SEARCH AND CATEGORY FILTERS ----------
    function filterMenu() {
      if (!foodGrid) return;

      const query = menuSearch
        ? menuSearch.value.trim().toLowerCase()
        : '';

      const cards = foodGrid.querySelectorAll('.food-card');
      let visibleCount = 0;

      cards.forEach((card) => {
        const name = (
          card.dataset.name ||
          card.querySelector('h3')?.textContent ||
          ''
        ).toLowerCase();

        const description =
          (card.textContent || '').toLowerCase();

        const category = (
          card.dataset.category || 'all'
        ).toLowerCase();

        const matchesText =
          !query ||
          name.includes(query) ||
          description.includes(query);

        const matchesCategory =
          activeCategory === 'all' ||
          category === activeCategory;

        const visible =
          matchesText && matchesCategory;

        card.hidden = !visible;

        if (visible) visibleCount++;
      });

      if (emptySearch) {
        emptySearch.hidden = visibleCount !== 0;
      }
    }

    if (menuSearch) {
      menuSearch.addEventListener('input', filterMenu);

      menuSearch.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          menuSearch.value = '';
          filterMenu();
        }
      });
    }

    if (filterButtons) {
      filterButtons.addEventListener('click', (event) => {
        const button = event.target.closest('.filter-btn');

        if (!button) return;

        activeCategory = (
          button.dataset.category || 'all'
        ).toLowerCase();

        filterButtons
          .querySelectorAll('.filter-btn')
          .forEach((filterButton) => {
            const active = filterButton === button;

            filterButton.classList.toggle(
              'active',
              active
            );

            filterButton.setAttribute(
              'aria-pressed',
              String(active)
            );
          });

        filterMenu();
      });
    }

    // ---------- ORDER TYPE AND ADDRESS ----------
    function updateOrderType() {
      const type = selectedOrderType();
      const isDelivery = type === 'delivery';

      if (addressField) {
        addressField.required = isDelivery;

        addressField.placeholder = isDelivery
          ? 'House number, street, area, city'
          : 'Optional: add pickup or dine-in details';
      }

      renderCart();
    }

    if (orderTypeSelect) {
      orderTypeSelect.addEventListener(
        'change',
        updateOrderType
      );
    }

    // ---------- PAYMENT INFORMATION ----------
    function updatePaymentNote() {
      if (!paymentMethodSelect || !paymentNote) return;

      const method = paymentMethodSelect.value;

      if (method === 'cod') {
        paymentNote.textContent =
          'Cash on delivery or pay at counter. ' +
          'Confirm payment with the restaurant.';
      } else if (method === 'upi') {
        paymentNote.textContent =
          'UPI is demo-only. Arrange payment directly ' +
          'with the restaurant.';
      } else if (method === 'card') {
        paymentNote.textContent =
          'Card payment is demo-only. Do not enter ' +
          'card details on this website.';
      } else {
        paymentNote.textContent =
          'No online payment is processed by this website.';
      }
    }

    if (paymentMethodSelect) {
      paymentMethodSelect.addEventListener(
        'change',
        updatePaymentNote
      );
    }

    // ---------- STATUS MESSAGES ----------
    function showMessage(message, isError) {
      if (!orderMessage) {
        window.alert(message);
        return;
      }

      orderMessage.textContent = message;

      orderMessage.classList.toggle(
        'error',
        Boolean(isError)
      );

      orderMessage.classList.toggle(
        'success',
        !isError
      );
    }

    // ---------- CHECKOUT AND WHATSAPP ----------
    if (orderForm) {
      orderForm.addEventListener('submit', (event) => {
        event.preventDefault();

        if (itemCount() === 0) {
          showMessage(
            'Your cart is empty. Add at least one dish first.',
            true
          );

          const cartSection = $('cart');

          if (cartSection) {
            cartSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }

          return;
        }

        updateOrderType();

        if (!orderForm.reportValidity()) return;

        const name =
          ($('customer-name')?.value ||
           $('name')?.value ||
           '').trim();

        const phone =
          ($('customer-phone')?.value ||
           $('phone')?.value ||
           '').trim();

        const address =
          (addressField?.value || '').trim();

        const type = selectedOrderType();

        const typeLabel =
          type === 'pickup'
            ? 'Self Pickup'
            : type === 'dinein'
              ? 'Dine In'
              : 'Home Delivery';

        const paymentLabel =
          paymentMethodSelect?.selectedOptions?.[0]
            ?.textContent || 'Not selected';

        const instructions =
          ($('special-instructions')?.value ||
           $('instructions')?.value ||
           '').trim() || 'None';

        const sub = subtotal();
        const fee = deliveryCharge();
        const total = sub + fee;

        const lines = cartValues().map((item) =>
          `• ${item.name} × ${item.qty} = ` +
          `${money(item.price * item.qty)}`
        );

        const message = [
          'Hello Vivek Family Dhaba!',
          'I would like to place an order.',
          '',
          `Name: ${name}`,
          `Customer phone: ${phone}`,
          `Order type: ${typeLabel}`,
          ...(address
            ? [`Address / location: ${address}`]
            : []),
          '',
          'Items:',
          ...lines,
          '',
          `Subtotal: ${money(sub)}`,
          `Delivery: ${money(fee)}`,
          `Total: ${money(total)}`,
          `Payment preference: ${paymentLabel}`,
          `Special instructions: ${instructions}`,
          'Restaurant location: Hyderabad, Telangana'
        ].join('\n');

        const whatsappUrl =
          `https://wa.me/${WHATSAPP_NUMBER}` +
          `?text=${encodeURIComponent(message)}`;

        showMessage(
          'Your order is ready. WhatsApp will open; ' +
          'review the details and press Send.',
          false
        );

        const whatsappWindow = window.open(
          whatsappUrl,
          '_blank',
          'noopener,noreferrer'
        );

        if (!whatsappWindow) {
          showMessage(
            'The browser blocked WhatsApp. Use the ' +
            'Continue to WhatsApp link below.',
            false
          );

          let link = $('whatsapp-order-link');

          if (!link) {
            link = document.createElement('a');
            link.id = 'whatsapp-order-link';
            link.className = 'btn btn-primary';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Continue to WhatsApp';

            orderForm.appendChild(link);
          }

          link.href = whatsappUrl;
        }
      });
    }

    // ---------- MOBILE NAVIGATION ----------
    if (menuToggle && navLinks) {
      menuToggle.addEventListener('click', () => {
        const isOpen =
          navLinks.classList.toggle('open');

        menuToggle.setAttribute(
          'aria-expanded',
          String(isOpen)
        );

        menuToggle.setAttribute(
          'aria-label',
          isOpen ? 'Close navigation' : 'Open navigation'
        );
      });

      navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');

          menuToggle.setAttribute(
            'aria-expanded',
            'false'
          );

          menuToggle.setAttribute(
            'aria-label',
            'Open navigation'
          );
        });
      });
    }

    // ---------- FOOTER YEAR ----------
    if (yearElement) {
      yearElement.textContent =
        String(new Date().getFullYear());
    }

    // ---------- INITIAL SETUP ----------
    updateOrderType();
    updatePaymentNote();
    filterMenu();
    renderCart();
  });
})();

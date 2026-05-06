// js/modules/i18n.js
'use strict';

const T = {
  es: {
    'search.ph': 'Buscar productos...',
    'nav.login': 'Iniciar sesión', 'nav.register': 'Registrarse',
    'nav.logout': 'Salir', 'nav.orders': 'Mis pedidos', 'nav.admin': 'Panel admin',
    'cat.all': 'Todos los productos',
    'filter.price': 'Precio máximo', 'filter.apply': 'Aplicar',
    'catalog.found': (n) => `${n} producto${n!==1?'s':''}`,
    'catalog.empty': 'Sin resultados para los filtros actuales.',
    'add': 'Agregar', 'add.cart': 'Agregar al carrito',
    'out': 'Agotado', 'low': (n) => `Quedan ${n}`, 'stock': (n) => `${n} disponibles`,
    'cart.title': 'Carrito', 'cart.empty': 'Tu carrito está vacío.',
    'cart.view': 'Explorar productos', 'cart.clear': 'Vaciar carrito',
    'cart.coupon': 'Código de descuento', 'cart.apply': 'Aplicar',
    'cart.shipping': 'Envío', 'cart.free': 'Gratis', 'cart.total': 'Total',
    'cart.checkout': 'Continuar al pago',
    'checkout.title': 'Finalizar compra', 'checkout.address': 'Dirección de envío',
    'checkout.payment': 'Método de pago', 'checkout.simulated': '(simulado — sin cargo real)',
    'checkout.confirm': 'Confirmar pedido', 'checkout.processing': 'Procesando...',
    'product.back': '← Catálogo', 'product.sku': 'SKU',
    'product.reviews': 'Valoraciones', 'product.no.reviews': 'Todavía no hay valoraciones.',
    'review.write': 'Escribe una valoración', 'review.submit': 'Publicar',
    'auth.email': 'Correo', 'auth.password': 'Contraseña',
    'auth.name': 'Nombre completo', 'auth.login': 'Iniciar sesión',
    'auth.register': 'Crear cuenta', 'auth.forgot': '¿Olvidaste tu contraseña?',
    'auth.back': 'Volver al inicio de sesión', 'auth.send': 'Enviar instrucciones',
    'profile.title': 'Mi perfil', 'profile.orders': 'Historial de pedidos',
    'profile.no.orders': 'Todavía no has realizado pedidos.',
    'profile.edit': 'Editar datos', 'profile.save': 'Guardar cambios',
    'profile.new.pwd': 'Nueva contraseña (dejar en blanco para no cambiar)',
    'status.pending': 'Pendiente', 'status.processing': 'En proceso',
    'status.shipped': 'Enviado', 'status.delivered': 'Entregado',
    'status.cancelled': 'Cancelado',
    'toast.added': (name) => `${name} añadido al carrito`,
    'toast.saved': 'Cambios guardados', 'toast.deleted': 'Eliminado correctamente',
    'toast.error': 'Ocurrió un error',
  },
  en: {
    'search.ph': 'Search products...',
    'nav.login': 'Sign in', 'nav.register': 'Sign up',
    'nav.logout': 'Sign out', 'nav.orders': 'My orders', 'nav.admin': 'Admin panel',
    'cat.all': 'All products',
    'filter.price': 'Max price', 'filter.apply': 'Apply',
    'catalog.found': (n) => `${n} product${n!==1?'s':''}`,
    'catalog.empty': 'No results for the current filters.',
    'add': 'Add', 'add.cart': 'Add to cart',
    'out': 'Out of stock', 'low': (n) => `${n} left`, 'stock': (n) => `${n} available`,
    'cart.title': 'Cart', 'cart.empty': 'Your cart is empty.',
    'cart.view': 'Browse products', 'cart.clear': 'Clear cart',
    'cart.coupon': 'Discount code', 'cart.apply': 'Apply',
    'cart.shipping': 'Shipping', 'cart.free': 'Free', 'cart.total': 'Total',
    'cart.checkout': 'Continue to checkout',
    'checkout.title': 'Checkout', 'checkout.address': 'Shipping address',
    'checkout.payment': 'Payment method', 'checkout.simulated': '(simulated — no real charge)',
    'checkout.confirm': 'Place order', 'checkout.processing': 'Processing...',
    'product.back': '← Catalog', 'product.sku': 'SKU',
    'product.reviews': 'Reviews', 'product.no.reviews': 'No reviews yet.',
    'review.write': 'Write a review', 'review.submit': 'Publish',
    'auth.email': 'Email', 'auth.password': 'Password',
    'auth.name': 'Full name', 'auth.login': 'Sign in',
    'auth.register': 'Create account', 'auth.forgot': 'Forgot your password?',
    'auth.back': 'Back to sign in', 'auth.send': 'Send instructions',
    'profile.title': 'My profile', 'profile.orders': 'Order history',
    'profile.no.orders': 'You have not placed any orders yet.',
    'profile.edit': 'Edit profile', 'profile.save': 'Save changes',
    'profile.new.pwd': 'New password (leave blank to keep current)',
    'status.pending': 'Pending', 'status.processing': 'Processing',
    'status.shipped': 'Shipped', 'status.delivered': 'Delivered',
    'status.cancelled': 'Cancelled',
    'toast.added': (name) => `${name} added to cart`,
    'toast.saved': 'Changes saved', 'toast.deleted': 'Deleted successfully',
    'toast.error': 'Something went wrong',
  }
};

let lang = localStorage.getItem('kova_lang') || 'es';

export function t(key, arg) {
  const dict = T[lang] || T.es;
  const val = dict[key] ?? T.es[key] ?? key;
  return typeof val === 'function' ? val(arg) : val;
}

export function setLang(l) {
  lang = l;
  localStorage.setItem('kova_lang', l);
  document.dispatchEvent(new Event('langchange'));
}

export function getLang() { return lang; }

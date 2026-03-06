import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "Discover": "Discover",
      "Browse Map": "Browse Map",
      "Favorites": "Favorites",
      "Store Menu": "Store Menu",
      "Partner Portal": "Partner Portal",
      "Admin Panel": "Admin Panel",
      "Technical Spec": "Technical Spec",
      "Logout": "Logout",
      "Profile": "Profile",
      "Notifications": "Notifications",
      "Mark all as read": "Mark all as read",
      "No notifications yet": "No notifications yet",
      "Just now": "Just now",
      "Debug Roles": "Debug Roles",
      "Customer View": "Customer View",
      "Restaurant View": "Restaurant View",
      "Admin View": "Admin View",
      "YuGoDa": "YuGoDa",
      "Search for food...": "Search for food...",
      "Categories": "Categories",
      "Price Range": "Price Range",
      "Sort by": "Sort by",
      "Price": "Price",
      "Distance": "Distance",
      "Delivery Speed": "Delivery Speed",
      "Dietary Preferences": "Dietary Preferences",
      "Add Tip": "Add Tip",
      "Checkout": "Checkout",
      "Reserve": "Reserve",
      "Pay": "Pay",
      "Success": "Success",
      "Review": "Review",
      "Pickup": "Pickup",
      "Delivery": "Delivery",
      "Live Tracking": "Live Tracking",
      "Driver is on the way": "Driver is on the way",
      "Order Delivered": "Order Delivered",
      "Proof of Delivery": "Proof of Delivery",
      "Help Center": "Help Center",
      "Open Ticket": "Open Ticket",
      "Live Chat": "Live Chat"
    }
  },
  ar: {
    translation: {
      "Discover": "اكتشف",
      "Browse Map": "تصفح الخريطة",
      "Favorites": "المفضلة",
      "Partner Portal": "بوابة الشركاء",
      "Admin Panel": "لوحة الإدارة",
      "Technical Spec": "المواصفات الفنية",
      "Logout": "تسجيل الخروج",
      "Profile": "الملف الشخصي",
      "Notifications": "التنبيهات",
      "Mark all as read": "تحديد الكل كمقروء",
      "No notifications yet": "لا توجد تنبيهات بعد",
      "YuGoDa": "إيكو بايت",
      "Search for food...": "ابحث عن طعام...",
      "Categories": "الفئات",
      "Price Range": "نطاق السعر",
      "Sort by": "ترتيب حسب",
      "Price": "السعر",
      "Distance": "المسافة",
      "Delivery Speed": "سرعة التوصيل",
      "Dietary Preferences": "التفضيلات الغذائية",
      "Add Tip": "إضافة بقشيش",
      "Checkout": "الدفع",
      "Pickup": "استلام",
      "Delivery": "توصيل",
      "Live Tracking": "تتبع مباشر",
      "Help Center": "مركز المساعدة"
    }
  },
  es: {
    translation: {
      "Discover": "Descubrir",
      "Browse Map": "Explorar Mapa",
      "Favorites": "Favoritos",
      "Partner Portal": "Portal de Socios",
      "Admin Panel": "Panel de Administración",
      "YuGoDa": "YuGoDa",
      "Search for food...": "Buscar comida...",
      "Categories": "Categorías",
      "Price Range": "Rango de Precios",
      "Sort by": "Ordenar por",
      "Price": "Precio",
      "Distance": "Distancia",
      "Delivery Speed": "Velocidad de Entrega",
      "Dietary Preferences": "Preferencias Dietéticas",
      "Add Tip": "Añadir Propina",
      "Checkout": "Pagar",
      "Pickup": "Recogida",
      "Delivery": "Entrega",
      "Live Tracking": "Seguimiento en Vivo",
      "Help Center": "Centro de Ayuda"
    }
  },
  pt: {
    translation: {
      "Discover": "Descobrir",
      "Browse Map": "Explorar Mapa",
      "Favorites": "Favoritos",
      "Partner Portal": "Portal de Parceiros",
      "Admin Panel": "Painel de Administração",
      "YuGoDa": "YuGoDa",
      "Search for food...": "Buscar comida...",
      "Categories": "Categorias",
      "Price Range": "Faixa de Preço",
      "Sort by": "Ordenar por",
      "Price": "Preço",
      "Distance": "Distância",
      "Delivery Speed": "Velocidade de Entrega",
      "Dietary Preferences": "Preferências Dietéticas",
      "Add Tip": "Adicionar Gorjeta",
      "Checkout": "Finalizar Compra",
      "Pickup": "Retirada",
      "Delivery": "Entrega",
      "Live Tracking": "Rastreamento ao Vivo",
      "Help Center": "Central de Ajuda"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

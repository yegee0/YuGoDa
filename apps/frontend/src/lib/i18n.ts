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
      "Live Chat": "Live Chat",
      "Current balance": "Current balance"
    }
  },
  tr: {
    translation: {
      "Discover": "Keşfet",
      "Browse Map": "Haritada Gez",
      "Favorites": "Favoriler",
      "Store Menu": "Mağaza Menüsü",
      "Partner Portal": "İş Ortağı Portalı",
      "Admin Panel": "Yönetici Paneli",
      "Technical Spec": "Teknik Özellikler",
      "Logout": "Çıkış Yap",
      "Profile": "Profil",
      "Notifications": "Bildirimler",
      "Mark all as read": "Tümünü okundu işaretle",
      "No notifications yet": "Henüz bildirim yok",
      "Just now": "Az önce",
      "Debug Roles": "Hata Ayıklama",
      "Customer View": "Müşteri Görünümü",
      "Restaurant View": "Restoran Görünümü",
      "Admin View": "Yönetici Görünümü",
      "YuGoDa": "YuGoDa",
      "Search for food...": "Yemek ara...",
      "Categories": "Kategoriler",
      "Price Range": "Fiyat Aralığı",
      "Sort by": "Sırala",
      "Price": "Fiyat",
      "Distance": "Mesafe",
      "Delivery Speed": "Teslimat Hızı",
      "Dietary Preferences": "Diyet Tercihleri",
      "Add Tip": "Bahşiş Ekle",
      "Checkout": "Ödeme",
      "Reserve": "Rezerve Et",
      "Pay": "Öde",
      "Success": "Başarılı",
      "Review": "Değerlendir",
      "Pickup": "Teslim Al",
      "Delivery": "Teslimat",
      "Live Tracking": "Canlı Takip",
      "Driver is on the way": "Kurye yolda",
      "Order Delivered": "Sipariş Teslim Edildi",
      "Proof of Delivery": "Teslimat Kanıtı",
      "Help Center": "Yardım Merkezi",
      "Open Ticket": "Destek Talebi Aç",
      "Live Chat": "Canlı Destek",
      "Current balance": "Mevcut bakiye"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

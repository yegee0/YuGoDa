package yugoda.init;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import yugoda.model.Bag;
import yugoda.model.Store;
import yugoda.model.User;
import yugoda.repository.BagRepository;
import yugoda.repository.StoreRepository;
import yugoda.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Seeds demo data on first startup when stores, users, and bags are all empty.
 * Creates 15 partner stores + matching restaurant users + 60 bags (4 per store),
 * centred around Yeditepe University / Kayışdağı Cad., Ataşehir.
 *
 * Firebase auth users are NOT created here. A human must create the 15 partner
 * Firebase accounts manually via Firebase Console using the seed emails
 * (<slug>@partner.com, password: partner).
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    // Approximate Yeditepe University / Kayışdağı Cad., Ataşehir center.
    private static final double CENTER_LAT = 40.9949;
    private static final double CENTER_LNG = 29.1189;

    private final BagRepository bagRepository;
    private final StoreRepository storeRepository;
    private final UserRepository userRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (storeRepository.count() > 0 || bagRepository.count() > 0) {
            return;
        }
        log.info("[DB] Empty database detected; loading seed data (17 stores, 17 users, 68 bags)...");

        List<Store> stores = buildStores();
        List<User> users = buildRestaurantUsers(stores);
        List<Bag> bags = buildBags(stores);

        // Snapshot the intended staggered createdAt values before saveAll,
        // because @CreationTimestamp overwrites them on INSERT.
        List<LocalDateTime> storeCreatedAt = stores.stream().map(Store::getCreatedAt).toList();
        List<LocalDateTime> userCreatedAt  = users.stream().map(User::getCreatedAt).toList();
        List<LocalDateTime> bagCreatedAt   = bags.stream().map(Bag::getCreatedAt).toList();

        storeRepository.saveAll(stores);
        userRepository.saveAll(users);
        bagRepository.saveAll(bags);

        // Second pass: restore the staggered values and re-save. Because the
        // entity IDs already exist, this runs as UPDATE; @CreationTimestamp
        // only fires on INSERT, so our values persist.
        for (int i = 0; i < stores.size(); i++) stores.get(i).setCreatedAt(storeCreatedAt.get(i));
        for (int i = 0; i < users.size();  i++) users.get(i).setCreatedAt(userCreatedAt.get(i));
        for (int i = 0; i < bags.size();   i++) bags.get(i).setCreatedAt(bagCreatedAt.get(i));
        storeRepository.saveAll(stores);
        userRepository.saveAll(users);
        bagRepository.saveAll(bags);

        log.info("[DB] Seeded {} stores, {} users, {} bags.",
                storeRepository.count(), userRepository.count(), bagRepository.count());
    }

    // ── Stores ─────────────────────────────────────────────────

    private List<Store> buildStores() {
        List<StoreSpec> specs = List.of(
            new StoreSpec("Simit Sarayı Ataşehir", "Bakery",
                "Ataşehir'in en taze simit ve poğaçaları. Her sabah fırından çıkan çıtır hamur işleri ile gününüzü güzelleştirin.",
                "Kayışdağı Cad. No:12, Ataşehir", 0.001, 0.000, 2),
            new StoreSpec("Anadolu Fırını", "Bakery",
                "Ekmek, pide ve börekte 30 yıllık deneyim. Günün sonunda kalan ürünleri değerlendirin.",
                "Barbaros Mah. Emirgan Cad. No:8, Ataşehir", -0.002, 0.003, 5),
            new StoreSpec("Köşe Fırın", "Bakery",
                "Mahalleli fırın; klasik beyaz ekmek, kepekli, açma ve kurabiye seçenekleri.",
                "İçerenköy Mah. Değirmen Sk. No:3, Ataşehir", 0.004, -0.002, 9),
            new StoreSpec("Mutfak Pazarı", "Grocery",
                "Günlük taze meyve, sebze ve organik ürünler. Fazla stok paketlerimizle israfı azaltın.",
                "Yeditepe Üniversitesi Civarı, Kayışdağı Cad., Ataşehir", 0.000, 0.002, 1),
            new StoreSpec("Bizim Manav", "Grocery",
                "Yerel üreticiden mevsimin sebze ve meyveleri. Her akşam indirimli sürpriz paketler.",
                "Esatpaşa Mah. Çamlık Cad. No:27, Ataşehir", -0.004, 0.001, 3),
            new StoreSpec("Taze Market", "Grocery",
                "Süt ürünleri, şarküteri ve hazır yemek çeşitleri; günün sonunda %70'e varan indirimler.",
                "Küçükbakkalköy Mah. Okul Sk. No:5, Ataşehir", 0.003, 0.004, 11),
            new StoreSpec("Kahve Dükkanı", "Cafe",
                "El yapımı tatlılar, sandviçler ve specialty kahve. Gün sonu tatlı paketlerimizi kaçırmayın.",
                "Barbaros Mah. Dereboyu Cad. No:15, Ataşehir", 0.002, -0.003, 6),
            new StoreSpec("Kitap & Kahve", "Cafe",
                "Kitap severlerin uğrak noktası. Kurabiye, kek ve kahve ile sürpriz paketler.",
                "İçerenköy Mah. Çay Sk. No:2, Ataşehir", -0.001, -0.002, 14),
            new StoreSpec("Günaydın Kafe", "Cafe",
                "Kahvaltılık ürünler, smoothie bowl ve ev yapımı tatlılar; kapanış saatlerinde bag indirimi.",
                "Atatürk Mah. Meriç Cad. No:21, Ataşehir", 0.005, 0.000, 19),
            new StoreSpec("Anadolu Sofrası", "Restaurant",
                "Ev yemekleri, çorbalar ve güveçler. Öğle servisinden kalan taze yemekleri değerlendirin.",
                "Yenisahra Mah. Kavak Sk. No:11, Ataşehir", -0.003, -0.004, 8),
            new StoreSpec("Balkon Restoran", "Restaurant",
                "Türk mutfağından seçme lezzetler. Akşam servisinden sonra kalan tabakları sürpriz paketle alın.",
                "Kayışdağı Cad. No:58, Ataşehir", 0.001, 0.005, 15),
            new StoreSpec("Kebapçı Mustafa", "Restaurant",
                "Odun ateşinde adana, urfa, kuşbaşı; lavaş ve mezelerle servis.",
                "Esatpaşa Mah. Gül Sk. No:7, Ataşehir", -0.005, 0.003, 20),
            new StoreSpec("İtalyan Mutfağı", "Restaurant",
                "El yapımı pizza, makarna ve risotto. Gün sonunda taze hazırlanan menülerden sürpriz kutu.",
                "Barbaros Mah. Ihlamur Cad. No:9, Ataşehir", 0.004, 0.001, 25),
            new StoreSpec("Sushi Noktası", "Restaurant",
                "Uzakdoğu mutfağından sushi, ramen ve bowl çeşitleri. Akşam servisinden kalan taze porsiyonlar.",
                "İçerenköy Mah. Sahil Yolu No:4, Ataşehir", 0.000, -0.005, 28),
            new StoreSpec("Yeditepe Vegan", "Restaurant",
                "Tamamen bitki bazlı mutfak; günün menüsünden kalan sağlıklı öğünler.",
                "Yeditepe Üniversitesi Karşısı, Ataşehir", -0.002, 0.004, 30),
            new StoreSpec("Yeşil Bahçe Salata", "Restaurant",
                "Mevsim yeşillikleri, kinoa, ızgara tavuk ve glutensiz bowl seçenekleri. Gün sonu salata ve sağlıklı paketler.",
                "Barbaros Mah. Yeşilbağ Sk. No:18, Ataşehir", 0.002, 0.002, 4),
            new StoreSpec("Salata Köşesi", "Restaurant",
                "Akdeniz tarzı salatalar, tahıl bowl'ları ve taze sıkılmış soslarla hazırlanan sağlıklı paketler.",
                "İçerenköy Mah. Çiçek Cad. No:9, Ataşehir", -0.003, 0.001, 7)
        );

        List<Store> stores = new ArrayList<>(specs.size());
        for (StoreSpec s : specs) {
            Store store = new Store();
            String slug = slugify(s.name());
            store.setId(slug);
            store.setName(s.name());
            store.setCategory(s.category());
            store.setDescription(s.description());
            store.setAddress(s.address());
            store.setLocation(String.format(Locale.ROOT, "{\"lat\":%.4f,\"lng\":%.4f}",
                    CENTER_LAT + s.latOffset(), CENTER_LNG + s.lngOffset()));
            store.setOperatingHours(operatingHoursFor(s.category()));
            store.setStatus("active");
            store.setIsApproved(1);
            store.setRating(4.2 + ((s.daysAgo() % 8) * 0.1));
            store.setEmail(slug + "@partner.com");
            store.setCommissionRate(15.0);
            store.setCreatedAt(LocalDateTime.now().minusDays(s.daysAgo()));
            stores.add(store);
        }
        return stores;
    }

    private String operatingHoursFor(String category) {
        return switch (category) {
            case "Bakery" -> "[{\"day\":\"Monday\",\"isOpen\":true,\"open\":\"06:00\",\"close\":\"19:00\"},"
                          + "{\"day\":\"Tuesday\",\"isOpen\":true,\"open\":\"06:00\",\"close\":\"19:00\"},"
                          + "{\"day\":\"Wednesday\",\"isOpen\":true,\"open\":\"06:00\",\"close\":\"19:00\"},"
                          + "{\"day\":\"Thursday\",\"isOpen\":true,\"open\":\"06:00\",\"close\":\"19:00\"},"
                          + "{\"day\":\"Friday\",\"isOpen\":true,\"open\":\"06:00\",\"close\":\"19:00\"},"
                          + "{\"day\":\"Saturday\",\"isOpen\":true,\"open\":\"07:00\",\"close\":\"18:00\"},"
                          + "{\"day\":\"Sunday\",\"isOpen\":true,\"open\":\"07:00\",\"close\":\"14:00\"}]";
            case "Grocery" -> "[{\"day\":\"Monday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"22:00\"},"
                            + "{\"day\":\"Tuesday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"22:00\"},"
                            + "{\"day\":\"Wednesday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"22:00\"},"
                            + "{\"day\":\"Thursday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"22:00\"},"
                            + "{\"day\":\"Friday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"22:00\"},"
                            + "{\"day\":\"Saturday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"22:00\"},"
                            + "{\"day\":\"Sunday\",\"isOpen\":true,\"open\":\"09:00\",\"close\":\"21:00\"}]";
            case "Cafe"  -> "[{\"day\":\"Monday\",\"isOpen\":true,\"open\":\"07:00\",\"close\":\"23:00\"},"
                          + "{\"day\":\"Tuesday\",\"isOpen\":true,\"open\":\"07:00\",\"close\":\"23:00\"},"
                          + "{\"day\":\"Wednesday\",\"isOpen\":true,\"open\":\"07:00\",\"close\":\"23:00\"},"
                          + "{\"day\":\"Thursday\",\"isOpen\":true,\"open\":\"07:00\",\"close\":\"23:00\"},"
                          + "{\"day\":\"Friday\",\"isOpen\":true,\"open\":\"07:00\",\"close\":\"24:00\"},"
                          + "{\"day\":\"Saturday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"24:00\"},"
                          + "{\"day\":\"Sunday\",\"isOpen\":true,\"open\":\"08:00\",\"close\":\"22:00\"}]";
            default -> "[{\"day\":\"Monday\",\"isOpen\":true,\"open\":\"11:00\",\"close\":\"23:00\"},"
                     + "{\"day\":\"Tuesday\",\"isOpen\":true,\"open\":\"11:00\",\"close\":\"23:00\"},"
                     + "{\"day\":\"Wednesday\",\"isOpen\":true,\"open\":\"11:00\",\"close\":\"23:00\"},"
                     + "{\"day\":\"Thursday\",\"isOpen\":true,\"open\":\"11:00\",\"close\":\"23:00\"},"
                     + "{\"day\":\"Friday\",\"isOpen\":true,\"open\":\"11:00\",\"close\":\"24:00\"},"
                     + "{\"day\":\"Saturday\",\"isOpen\":true,\"open\":\"11:00\",\"close\":\"24:00\"},"
                     + "{\"day\":\"Sunday\",\"isOpen\":true,\"open\":\"12:00\",\"close\":\"22:00\"}]";
        };
    }

    // ── Restaurant users ──────────────────────────────────────

    private List<User> buildRestaurantUsers(List<Store> stores) {
        List<User> users = new ArrayList<>(stores.size());
        for (Store s : stores) {
            User u = new User();
            u.setUid(s.getId());
            u.setEmail(s.getEmail());
            u.setDisplayName(s.getName());
            u.setRole("restaurant");
            u.setFavorites("[]");
            u.setAddresses("[]");
            u.setNotificationsEnabled(1);
            u.setPreferredLanguage("tr");
            u.setLanguage("tr");
            u.setCreatedAt(s.getCreatedAt());
            users.add(u);
        }
        return users;
    }

    // ── Bags (4 per store) ────────────────────────────────────

    private List<Bag> buildBags(List<Store> stores) {
        List<Bag> bags = new ArrayList<>(stores.size() * 4);
        String[] bakeryBagNames = {"Fırın Sürprizi", "Hamur İşi Karması", "Gün Sonu Paketi", "Taze Ekmek Paketi"};
        String[] groceryBagNames = {"Meyve Kasası", "Sebze Karması", "Atıştırmalık Paketi", "Organik Seçki"};
        String[] cafeBagNames = {"Kahve & Tatlı", "Sandviç Paketi", "Kek & Kurabiye", "Brunch Paketi"};
        String[] restaurantBagNames = {"Günün Menüsü", "Chef Sürprizi", "Öğle Tabağı", "Akşam Sürprizi"};
        String[] saladBagNames = {"Mevsim Salata Karması", "Tavuklu Salata Bowl", "Akdeniz Salata Tabağı", "Süperfood Salata Sürprizi"};
        String[] images = {
            "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1559314809-0d155014e29e?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=800"
        };

        for (int i = 0; i < stores.size(); i++) {
            Store store = stores.get(i);
            // Salad-themed stores (detected by name) get salad-specific bag names so
            // user queries like "salata var mı?" can match real entries instead of
            // pushing the model to hallucinate generic dish names.
            String[] names;
            if (store.getName().toLowerCase(Locale.ROOT).contains("salata")) {
                names = saladBagNames;
            } else {
                names = switch (store.getCategory()) {
                    case "Bakery" -> bakeryBagNames;
                    case "Grocery" -> groceryBagNames;
                    case "Cafe" -> cafeBagNames;
                    default -> restaurantBagNames;
                };
            }
            for (int j = 0; j < 4; j++) {
                Bag b = new Bag();
                b.setId(store.getId() + "-bag-" + (j + 1));
                b.setRestaurantId(store.getId());
                b.setRestaurantName(store.getName());
                b.setCategory(store.getCategory());
                b.setMerchantType(store.getCategory());
                b.setDescription(bagDescriptionFor(store.getCategory(), names[j]));
                double price = 35.0 + (j * 15.0) + (i % 4) * 5.0;
                b.setPrice(price);
                b.setOriginalPrice(price * 2.8);
                b.setAvailable(2 + ((i + j) % 5));
                b.setPickupTime(pickupTimeFor(store.getCategory(), j));
                b.setImage(images[(i * 4 + j) % images.length]);
                boolean isSalad = names[j].toLowerCase(Locale.ROOT).contains("salata");
                b.setTags(isSalad ? "[\"Healthy\",\"Fresh\",\"Salad\"]" : tagsFor(store.getCategory()));
                // Salad bags: alternate Vegan / Vegetarian (most are plant-forward),
                // except 'Tavuklu' (chicken) which stays non-vegan.
                String dietary;
                if (isSalad) {
                    dietary = names[j].toLowerCase(Locale.ROOT).contains("tavuklu")
                            ? "Non-Vegan" : (j % 2 == 0 ? "Vegan" : "Vegetarian");
                } else {
                    dietary = dietaryFor(store.getCategory(), j);
                }
                b.setDietaryType(dietary);
                b.setCalories(280 + ((i + j) % 6) * 40);
                b.setDistance(null);
                b.setCoordinates(store.getLocation());
                boolean lastChance = ((i + j) % 7 == 0);
                b.setIsLastChance(lastChance ? 1 : 0);
                b.setCountdown(lastChance ? "01:30:00" : null);
                b.setRating(Math.min(5.0, 4.2 + ((i + j) % 9) * 0.1));
                b.setCreatedAt(store.getCreatedAt().plusDays(Math.min(7L, j * 2L)));
                bags.add(b);
            }
        }
        return bags;
    }

    private String bagDescriptionFor(String category, String name) {
        if (name.toLowerCase(Locale.ROOT).contains("salata")) {
            return name + " — taze mevsim yeşillikleri, kinoa, ızgara protein ve tahıllarla hazırlanmış sağlıklı salata paketi.";
        }
        return switch (category) {
            case "Bakery"  -> name + " — fırından taze çıkan ekmek, poğaça ve hamur işlerinden sürpriz seçki.";
            case "Grocery" -> name + " — günün taze meyve, sebze ve kuru gıdalarından özenle hazırlanmış paket.";
            case "Cafe"   -> name + " — kahve yanına tatlı, sandviç ve atıştırmalıklardan oluşan sürpriz kutu.";
            default -> name + " — gün sonunda kalan taze öğünlerden, şefin seçtiği sürpriz menü.";
        };
    }

    private String pickupTimeFor(String category, int slot) {
        return switch (category) {
            case "Bakery"  -> slot % 2 == 0 ? "17:00-19:00" : "10:00-12:00";
            case "Grocery" -> "20:00-22:00";
            case "Cafe"   -> slot % 2 == 0 ? "21:00-23:00" : "15:00-17:00";
            default -> slot % 2 == 0 ? "21:00-23:00" : "14:00-16:00";
        };
    }

    private String tagsFor(String category) {
        return switch (category) {
            case "Bakery"  -> "[\"Fresh\",\"Baked\"]";
            case "Grocery" -> "[\"Organic\",\"Seasonal\"]";
            case "Cafe"   -> "[\"Coffee\",\"Artisan\"]";
            default -> "[\"HomeCooked\",\"Traditional\"]";
        };
    }

    private String dietaryFor(String category, int slot) {
        if ("Bakery".equals(category) || "Grocery".equals(category)) return slot % 2 == 0 ? "Vegetarian" : "Vegan";
        if ("Cafe".equals(category)) return slot % 3 == 0 ? "Vegan" : "Vegetarian";
        return slot % 3 == 0 ? "Vegetarian" : "Non-Vegan";
    }

    private String slugify(String name) {
        String normalized = name
                .replace("ı", "i").replace("İ", "i")
                .replace("ö", "o").replace("Ö", "o")
                .replace("ü", "u").replace("Ü", "u")
                .replace("ç", "c").replace("Ç", "c")
                .replace("ş", "s").replace("Ş", "s")
                .replace("ğ", "g").replace("Ğ", "g")
                .replace("&", "and")
                .toLowerCase();
        return normalized.replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    private record StoreSpec(String name, String category, String description, String address,
                              double latOffset, double lngOffset, int daysAgo) {}
}

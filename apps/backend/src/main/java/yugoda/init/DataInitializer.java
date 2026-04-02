package yugoda.init;

import yugoda.model.Bag;
import yugoda.repository.BagRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds demo bag data on first startup if the bags table is empty.
 * Mirrors the JS seed.js data.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final BagRepository bagRepository;

    @Override
    public void run(ApplicationArguments args) {
        if (bagRepository.count() == 0) {
            log.info("[DB] Bags tablosu boş, seed verileri yükleniyor...");
            bagRepository.saveAll(buildSeedBags());
            log.info("[DB] {} seed bag yüklendi.", bagRepository.count());
        }
    }

    private List<Bag> buildSeedBags() {
        return List.of(
            bag("green-bakery-1", "green-bakery", "Green Bakery", "Bakery", "Bakery",
                "Freshly baked bread, pastries, and sweets from our local bakery.", 45.0, 120.0, 3,
                "16:00-19:00", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
                "[\"Vegan\",\"Fresh\"]", "Vegan", 320, "0.8 km",
                "{\"lat\":41.0082,\"lng\":28.9784}", false, null, 4.7),

            bag("sushi-daily-1", "sushi-daily", "Sushi Daily", "Sushi", "Restaurant",
                "Premium sushi and Japanese cuisine surprise box.", 89.0, 220.0, 2,
                "19:00-22:00", "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400",
                "[\"Japanese\",\"Seafood\"]", "Non-Vegan", 450, "1.2 km",
                "{\"lat\":41.0155,\"lng\":28.9744}", false, null, 4.9),

            bag("fresh-market-1", "fresh-market", "Fresh Market", "Grocery", "Grocery",
                "Mixed bag of fresh fruits and vegetables of the day.", 35.0, 90.0, 5,
                "17:00-20:00", "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
                "[\"Organic\",\"Seasonal\"]", "Vegan", 180, "0.5 km",
                "{\"lat\":41.0110,\"lng\":28.9650}", false, null, 4.5),

            bag("vegan-bowl-1", "vegan-bowl", "The Vegan Bowl", "Vegan", "Restaurant",
                "Plant-based meals full of flavor. Random selection of the day's specials.", 65.0, 160.0, 4,
                "18:00-21:00", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
                "[\"Vegan\",\"GlutenFree\"]", "Vegan", 380, "2.1 km",
                "{\"lat\":41.0200,\"lng\":28.9800}", false, null, 4.8),

            bag("pizza-bulls-1", "pizza-bulls", "Pizza Bulls", "Pizza", "Restaurant",
                "End-of-day pizza slices and calzones from our wood-fired oven.", 55.0, 140.0, 6,
                "20:00-23:00", "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
                "[\"Italian\",\"Comfort\"]", "Non-Vegan", 520, "1.8 km",
                "{\"lat\":41.0050,\"lng\":28.9900}", true, "02:30:00", 4.3),

            bag("cafe-lumiere-1", "cafe-lumiere", "Café Lumière", "Cafe", "Cafe",
                "Artisan sandwiches, cakes, and beverages from our French-inspired café.", 40.0, 100.0, 3,
                "15:00-18:00", "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400",
                "[\"French\",\"Coffee\"]", "Vegetarian", 290, "0.9 km",
                "{\"lat\":41.0120,\"lng\":28.9720}", false, null, 4.6),

            bag("thai-garden-1", "thai-garden", "Thai Garden", "Thai", "Restaurant",
                "Authentic Thai dishes prepared fresh daily. Contains rice, curry, or noodles.", 75.0, 185.0, 2,
                "17:30-21:30", "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400",
                "[\"Thai\",\"Spicy\"]", "Non-Vegan", 480, "3.0 km",
                "{\"lat\":41.0250,\"lng\":28.9600}", false, null, 4.7),

            bag("la-panaderia-1", "la-panaderia", "La Panadería", "Bakery", "Bakery",
                "Traditional Spanish bread, empanadas, and churros — baked fresh every morning.", 50.0, 130.0, 4,
                "16:30-19:30", "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
                "[\"Spanish\",\"Baked\"]", "Vegetarian", 340, "1.5 km",
                "{\"lat\":41.0180,\"lng\":28.9850}", false, null, 4.4),

            bag("halal-grill-1", "halal-grill", "Halal Grill House", "Grill", "Restaurant",
                "Halal-certified grilled meats, wraps, and sides from our grill station.", 80.0, 200.0, 3,
                "19:30-23:00", "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
                "[\"Halal\",\"Grill\"]", "Non-Vegan", 600, "2.5 km",
                "{\"lat\":41.0070,\"lng\":28.9950}", true, "01:45:00", 4.8),

            bag("keto-kitchen-1", "keto-kitchen", "Keto Kitchen", "Keto", "Restaurant",
                "Low-carb, high-protein meals for keto and paleo lifestyles.", 70.0, 175.0, 2,
                "18:00-21:00", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
                "[\"Keto\",\"Paleo\",\"GlutenFree\"]", "Non-Vegan", 420, "4.0 km",
                "{\"lat\":41.0300,\"lng\":28.9700}", false, null, 4.5),

            bag("pure-deli-1", "pure-deli", "Pure Deli", "Deli", "Deli",
                "Artisan cold cuts, cheeses, and deli salads from our local charcuterie.", 60.0, 150.0, 5,
                "15:30-18:30", "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400",
                "[\"Artisan\",\"Cheese\"]", "Non-Vegan", 350, "1.1 km",
                "{\"lat\":41.0090,\"lng\":28.9780}", false, null, 4.6),

            bag("burgerbros-1", "burgerbros", "BurgerBros", "Burger", "Restaurant",
                "Gourmet burgers and loaded fries — end-of-day specials.", 60.0, 155.0, 4,
                "20:30-23:59", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
                "[\"American\",\"Comfort\"]", "Non-Vegan", 650, "2.3 km",
                "{\"lat\":41.0140,\"lng\":28.9680}", true, "00:45:00", 4.4)
        );
    }

    private Bag bag(String id, String restaurantId, String restaurantName, String category,
                    String merchantType, String description, double price, double originalPrice,
                    int available, String pickupTime, String image, String tags, String dietaryType,
                    int calories, String distance, String coordinates, boolean isLastChance,
                    String countdown, double rating) {
        Bag b = new Bag();
        b.setId(id);
        b.setRestaurantId(restaurantId);
        b.setRestaurantName(restaurantName);
        b.setCategory(category);
        b.setMerchantType(merchantType);
        b.setDescription(description);
        b.setPrice(price);
        b.setOriginalPrice(originalPrice);
        b.setAvailable(available);
        b.setPickupTime(pickupTime);
        b.setImage(image);
        b.setTags(tags);
        b.setDietaryType(dietaryType);
        b.setCalories(calories);
        b.setDistance(distance);
        b.setCoordinates(coordinates);
        b.setIsLastChance(isLastChance ? 1 : 0);
        b.setCountdown(countdown);
        b.setRating(rating);
        return b;
    }
}

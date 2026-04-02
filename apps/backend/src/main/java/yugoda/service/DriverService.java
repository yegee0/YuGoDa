package yugoda.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Driver;
import yugoda.repository.DriverRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DriverService {

    private final DriverRepository driverRepository;
    private final ObjectMapper objectMapper;

    public List<Driver> listDrivers(String status) {
        if (status != null) return driverRepository.findByStatusOrderByRatingDesc(status);
        return driverRepository.findAllByOrderByRatingDesc();
    }

    @Transactional
    public Driver updateDriver(String driverId, String uid, String role, Map<String, Object> body) {
        if (!"admin".equals(role) && !uid.equals(driverId)) {
            throw new SecurityException("Bu kuryeyi güncelleme yetkiniz yok.");
        }

        Driver driver = driverRepository.findById(driverId).orElseGet(() -> {
            Driver d = new Driver();
            d.setUid(driverId);
            d.setStatus("offline");
            return driverRepository.save(d);
        });

        if (body.containsKey("status")) driver.setStatus((String) body.get("status"));
        if (body.containsKey("vehicleInfo")) driver.setVehicleInfo((String) body.get("vehicleInfo"));
        if (body.containsKey("phone")) driver.setPhone((String) body.get("phone"));
        if (body.containsKey("currentLocation")) {
            try {
                driver.setCurrentLocation(objectMapper.writeValueAsString(body.get("currentLocation")));
            } catch (Exception ignored) {}
        }

        return driverRepository.save(driver);
    }
}

package yugoda.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import yugoda.model.Driver;
import yugoda.security.UserPrincipal;
import yugoda.service.DriverService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/drivers")
@RequiredArgsConstructor
public class DriverController extends BaseController {

    private final DriverService driverService;
    private final ObjectMapper objectMapper;

    // GET /
    @GetMapping
    public ResponseEntity<Map<String, Object>> listDrivers(HttpServletRequest request,
                                                            @RequestParam(required = false) String status) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (!hasRole(user, "restaurant", "admin")) return forbidden("Bu işlem için yetkiniz bulunmamaktadır.");

        List<Driver> drivers = driverService.listDrivers(status);
        List<Map<String, Object>> enriched = drivers.stream().map(this::enrichDriver).toList();
        return ResponseEntity.ok(Map.of("success", true, "drivers", enriched));
    }

    // PUT /:id
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDriver(HttpServletRequest request,
                                                             @PathVariable String id,
                                                             @RequestBody Map<String, Object> body) {
        UserPrincipal user = getUser(request);
        if (!requireAuth(user)) return unauthorized("Yetkilendirme token'ı bulunamadı.");
        if (body.isEmpty()) return badRequest("Güncellenecek alan bulunamadı.");
        try {
            Driver driver = driverService.updateDriver(id, user.getUid(), user.getRole(), body);
            return ResponseEntity.ok(Map.of("success", true, "driver", enrichDriver(driver)));
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        }
    }

    private Map<String, Object> enrichDriver(Driver driver) {
        Map<String, Object> map = objectMapper.convertValue(driver, Map.class);
        try {
            map.put("currentLocation", driver.getCurrentLocation() != null
                    ? objectMapper.readValue(driver.getCurrentLocation(), Object.class) : null);
        } catch (Exception ignored) {}
        return map;
    }
}

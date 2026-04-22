package yugoda;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class YuGoDaApplication {
    public static void main(String[] args) {
        SpringApplication.run(YuGoDaApplication.class, args);
    }
}

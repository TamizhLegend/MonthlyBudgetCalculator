package com.monthlybudget.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public OpenAPI monthlyBudgetOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Monthly Budget Calculator API")
                        .description("""
                                Backend for the Yearly Expense Sheet React app.
                                
                                **Storage:** Neon PostgreSQL
                                
                                **Frontend:** Vite proxies `/api` → this server.
                                
                                Open Swagger at `/swagger-ui/index.html` (or `/docs`).
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Monthly Budget Calculator")
                                .url("http://localhost:5174")))
                .externalDocs(new ExternalDocumentation()
                        .description("React frontend")
                        .url("http://localhost:5174"))
                .servers(List.of(
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Spring Boot API")
                ))
                .tags(List.of(
                        new Tag().name("Health").description("Liveness check"),
                        new Tag().name("Months").description("Monthly expense CRUD"),
                        new Tag().name("Recurring").description("Recurring expense templates"),
                        new Tag().name("Category Limits").description("Default per-category budget limits")
                ));
    }
}

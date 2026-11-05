package com.monthlybudget.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
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

    @Value("${app.public-api-url:https://monthlybudgetcalculator.onrender.com}")
    private String publicApiUrl;

    @Bean
    public OpenAPI monthlyBudgetOpenApi() {
        final String bearerScheme = "bearer-jwt";

        return new OpenAPI()
                .info(new Info()
                        .title("Monthly Budget Calculator API")
                        .description("""
                                Backend for the Yearly Expense Sheet React app.
                                
                                **Storage:** Neon PostgreSQL
                                
                                **Auth:** Neon Managed Auth JWT (EdDSA). Click **Authorize** and paste
                                a Bearer token from the signed-in frontend session. `/api/v1/health` stays public.
                                
                                Open Swagger at `/swagger-ui/index.html` (or `/docs`).
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Monthly Budget Calculator")
                                .url(publicApiUrl)))
                .externalDocs(new ExternalDocumentation()
                        .description("Deployed API")
                        .url(publicApiUrl))
                .servers(List.of(
                        new Server()
                                .url(publicApiUrl)
                                .description("Render production API"),
                        new Server()
                                .url("http://localhost:" + serverPort)
                                .description("Local Spring Boot API")
                ))
                .components(new Components()
                        .addSecuritySchemes(bearerScheme, new SecurityScheme()
                                .name(bearerScheme)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Neon Auth JWT (from frontend session /auth token)")))
                .addSecurityItem(new SecurityRequirement().addList(bearerScheme))
                .tags(List.of(
                        new Tag().name("Health").description("Liveness check (public)"),
                        new Tag().name("Months").description("Monthly expense CRUD (JWT required)"),
                        new Tag().name("Recurring").description("Recurring expense templates (JWT required)"),
                        new Tag().name("Category Limits").description("Default per-category budget limits (JWT required)")
                ));
    }
}

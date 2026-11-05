package com.monthlybudget.config;

import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.util.DefaultResourceRetriever;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.util.StringUtils;

import java.net.URL;
import java.time.Duration;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/v1/health",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/docs",
                                "/swagger",
                                "/"
                        ).permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));

        return http.build();
    }

    /**
     * Neon Managed Auth signs JWTs with EdDSA (Ed25519 / OKP).
     * Standard {@code NimbusJwtDecoder} cannot verify those keys — use a custom decoder.
     */
    @Bean
    JwtDecoder jwtDecoder(
            @Value("${app.neon-auth.jwks-url}") String jwksUrl,
            @Value("${app.neon-auth.issuer:}") String issuer
    ) throws Exception {
        DefaultResourceRetriever retriever = new DefaultResourceRetriever(
                (int) Duration.ofSeconds(5).toMillis(),
                (int) Duration.ofSeconds(5).toMillis()
        );
        JWKSource<SecurityContext> jwkSource = new RemoteJWKSet<>(new URL(jwksUrl), retriever);

        OAuth2TokenValidator<Jwt> validator = StringUtils.hasText(issuer)
                ? JwtValidators.createDefaultWithIssuer(issuer)
                : JwtValidators.createDefault();

        return new NeonEdDsaJwtDecoder(jwkSource, new DelegatingOAuth2TokenValidator<>(validator));
    }
}

package com.monthlybudget.config;

import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.util.DefaultResourceRetriever;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtValidators;

import java.net.URL;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class NeonEdDsaJwtDecoderTest {

    private static final String JWKS_URL =
            "https://ep-cool-river-bed2ay6c.neonauth.c-9.us-east-2.aws.neon.tech/neondb/auth/.well-known/jwks.json";
    private static final String ISSUER =
            "https://ep-cool-river-bed2ay6c.neonauth.c-9.us-east-2.aws.neon.tech";

    @Test
    void decodesLiveNeonEdDsaTokenWhenProvided() throws Exception {
        String token = System.getenv("NEON_TEST_JWT");
        Assumptions.assumeTrue(token != null && !token.isBlank(), "NEON_TEST_JWT not set");

        DefaultResourceRetriever retriever = new DefaultResourceRetriever(
                (int) Duration.ofSeconds(5).toMillis(),
                (int) Duration.ofSeconds(5).toMillis()
        );
        NeonEdDsaJwtDecoder decoder = new NeonEdDsaJwtDecoder(
                new RemoteJWKSet<>(new URL(JWKS_URL), retriever),
                JwtValidators.createDefaultWithIssuer(ISSUER)
        );

        Jwt jwt = decoder.decode(token);
        assertNotNull(jwt.getSubject());
        assertEquals(ISSUER, jwt.getIssuer().toString());
    }
}

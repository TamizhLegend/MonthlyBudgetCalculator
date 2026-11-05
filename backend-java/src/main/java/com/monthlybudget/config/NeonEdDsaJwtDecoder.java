package com.monthlybudget.config;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.Ed25519Verifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKMatcher;
import com.nimbusds.jose.jwk.JWKSelector;
import com.nimbusds.jose.jwk.KeyType;
import com.nimbusds.jose.jwk.OctetKeyPair;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidationException;

import java.text.ParseException;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Neon Managed Auth signs JWTs with EdDSA (OKP / Ed25519).
 * Spring's {@code NimbusJwtDecoder} cannot verify those keys because Nimbus
 * {@code KeyConverter} silently drops {@link OctetKeyPair}s and
 * {@code DefaultJWSVerifierFactory} has no Ed25519 path.
 */
final class NeonEdDsaJwtDecoder implements JwtDecoder {

    private final JWKSource<SecurityContext> jwkSource;
    private final OAuth2TokenValidator<Jwt> jwtValidator;

    NeonEdDsaJwtDecoder(JWKSource<SecurityContext> jwkSource, OAuth2TokenValidator<Jwt> jwtValidator) {
        this.jwkSource = jwkSource;
        this.jwtValidator = jwtValidator;
    }

    @Override
    public Jwt decode(String token) {
        try {
            SignedJWT signedJwt = SignedJWT.parse(token);
            JWSHeader header = signedJwt.getHeader();
            JWSAlgorithm alg = header.getAlgorithm();
            if (!JWSAlgorithm.EdDSA.equals(alg) && !"Ed25519".equals(alg.getName())) {
                throw new BadJwtException("Unsupported JWT algorithm: " + alg);
            }

            OctetKeyPair publicKey = resolvePublicKey(header);
            if (!signedJwt.verify(new Ed25519Verifier(publicKey))) {
                throw new BadJwtException("Invalid EdDSA signature");
            }

            Jwt jwt = createJwt(token, signedJwt);
            OAuth2TokenValidatorResult result = jwtValidator.validate(jwt);
            if (result.hasErrors()) {
                Collection<OAuth2Error> errors = result.getErrors();
                throw new JwtValidationException(
                        "JWT validation failed: " + errors.iterator().next().getDescription(),
                        errors
                );
            }
            return jwt;
        } catch (ParseException | JOSEException ex) {
            throw new BadJwtException("Failed to decode JWT: " + ex.getMessage(), ex);
        }
    }

    private OctetKeyPair resolvePublicKey(JWSHeader header) throws JOSEException {
        JWKMatcher.Builder matcher = new JWKMatcher.Builder()
                .keyType(KeyType.OKP)
                .algorithm(JWSAlgorithm.EdDSA);
        if (header.getKeyID() != null) {
            matcher.keyID(header.getKeyID());
        }

        List<JWK> matches;
        try {
            matches = jwkSource.get(new JWKSelector(matcher.build()), null);
        } catch (Exception ex) {
            throw new BadJwtException("Unable to load JWKS for JWT verification", ex);
        }

        if (matches == null || matches.isEmpty()) {
            // Retry without alg constraint — some JWKS omit "alg"
            JWKMatcher.Builder fallback = new JWKMatcher.Builder().keyType(KeyType.OKP);
            if (header.getKeyID() != null) {
                fallback.keyID(header.getKeyID());
            }
            try {
                matches = jwkSource.get(new JWKSelector(fallback.build()), null);
            } catch (Exception ex) {
                throw new BadJwtException("Unable to load JWKS for JWT verification", ex);
            }
        }

        if (matches == null || matches.isEmpty()) {
            throw new BadJwtException("No matching Ed25519 JWK found for kid=" + header.getKeyID());
        }

        JWK jwk = matches.get(0);
        if (!(jwk instanceof OctetKeyPair okp)) {
            throw new BadJwtException("Expected OKP JWK, got " + jwk.getKeyType());
        }
        return okp.toPublicJWK();
    }

    private static Jwt createJwt(String token, SignedJWT signedJwt) throws ParseException {
        JWTClaimsSet claimsSet = signedJwt.getJWTClaimsSet();
        Map<String, Object> headers = new LinkedHashMap<>(signedJwt.getHeader().toJSONObject());
        Map<String, Object> claims = new LinkedHashMap<>(claimsSet.getClaims());

        Instant issuedAt = toInstant(claimsSet.getIssueTime());
        Instant expiresAt = toInstant(claimsSet.getExpirationTime());
        Instant notBefore = toInstant(claimsSet.getNotBeforeTime());

        if (issuedAt != null) {
            claims.put(JwtClaimNames.IAT, issuedAt);
        }
        if (expiresAt != null) {
            claims.put(JwtClaimNames.EXP, expiresAt);
        }
        if (notBefore != null) {
            claims.put(JwtClaimNames.NBF, notBefore);
        }

        Instant jwtIssuedAt = issuedAt != null ? issuedAt : Instant.now();
        return new Jwt(token, jwtIssuedAt, expiresAt, headers, claims);
    }

    private static Instant toInstant(Date date) {
        return date == null ? null : date.toInstant();
    }
}

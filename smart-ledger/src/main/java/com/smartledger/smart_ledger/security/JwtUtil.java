package com.smartledger.smart_ledger.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // NOTE: the new jjwt library enforces a minimum key length for HS256
    // (256 bits / 32+ characters). Your old secret "smartledgersecretkey"
    // is only 21 characters and would throw a WeakKeyException here —
    // it's been lengthened below to satisfy that requirement.
    private final SecretKey secretKey =
            Keys.hmacShaKeyFor("smartledgersecretkeysmartledgersecretkey123456".getBytes());

    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }
}

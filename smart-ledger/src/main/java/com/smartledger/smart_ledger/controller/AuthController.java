package com.smartledger.smart_ledger.controller;

import com.smartledger.smart_ledger.entity.User;
import com.smartledger.smart_ledger.repository.UserRepository;
import com.smartledger.smart_ledger.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://6a1dab9c595d8126f6b7af0c--cozy-llama-f2a871.netlify.app"
})
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;


    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {

        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.status(409).body("Email already registered");
        }


        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail());
        return ResponseEntity.ok(Collections.singletonMap("token", token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User loginUser) {
        User user = userRepository.findByEmail(loginUser.getEmail()).orElse(null);

        if (user == null || !user.getPassword().equals(loginUser.getPassword())) {
            return ResponseEntity.status(401).body("Invalid Email or Password");
        }

        String token = jwtUtil.generateToken(user.getEmail());


        return ResponseEntity.ok(Map.of(
                "token", token,
                "name", user.getName() != null ? user.getName() : ""
        ));
    }
}
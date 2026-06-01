package com.smartledger.smart_ledger.controller;

import com.smartledger.smart_ledger.entity.Transaction;
import com.smartledger.smart_ledger.repository.TransactionRepository;
import com.smartledger.smart_ledger.service.TransactionService;
import com.smartledger.smart_ledger.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*",
        methods = {RequestMethod.GET, RequestMethod.POST})
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private TransactionRepository transactionRepository;


    @Autowired
    private JwtUtil jwtUtil;


    private String getUserIdFromHeader(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                return jwtUtil.extractUsername(token);
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }


    @GetMapping
    public ResponseEntity<?> getAllTransactions(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String userId = getUserIdFromHeader(authHeader);

        if (userId == null) {

            return ResponseEntity.status(401).body("Unauthorized");
        }

        List<Transaction> userTransactions = transactionRepository.findByUserId(userId);
        return ResponseEntity.ok(userTransactions);
    }


    @PostMapping("/add")
    public ResponseEntity<?> addTransaction(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam("amount") Double amount,
            @RequestParam("merchant") String merchant,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "rawSms", required = false) String rawSms) {

        String userId = getUserIdFromHeader(authHeader);

        if (userId == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Transaction transaction = new Transaction();


        transaction.setUserId(userId);
        transaction.setAmount(amount);

        String cleanCategory = (category != null && !category.trim().isEmpty())
                ? category.trim() : "Food";
        transaction.setCategory(cleanCategory);
        transaction.setMerchant(cleanCategory);
        transaction.setRawSms(rawSms != null ? rawSms : "");

        Transaction saved = transactionRepository.save(transaction);
        return ResponseEntity.ok(saved);
    }
}
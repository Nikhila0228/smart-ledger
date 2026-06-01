package com.smartledger.smart_ledger.service;

import com.smartledger.smart_ledger.entity.Transaction;
import com.smartledger.smart_ledger.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;


@Service
public class TransactionService {

    @Autowired
    private TransactionRepository transactionRepository;


    public Transaction processAndSaveTransaction(Double amount, String merchant, String rawSms) {
        String category = autoCategorize(merchant);

        Transaction transaction = Transaction.builder()
                .amount(amount)
                .merchant(merchant)
                .category(category)
                .rawSms(rawSms)
                .transactionDate(LocalDateTime.now())
                .build();

        return transactionRepository.save(transaction);
    }


    private String autoCategorize(String merchant) {
        String name = merchant.toLowerCase();

        if (name.contains("zomato") || name.contains("swiggy") || name.contains("restaurant")) {
            return "Food";
        } else if (name.contains("uber") || name.contains("ola") || name.contains("petrol")) {
            return "Travel";
        } else if (name.contains("amazon") || name.contains("flipkart") || name.contains("myntra")) {
            return "Shopping";
        } else if (name.contains("recharge") || name.contains("airtel") || name.contains("jio")) {
            return "Bills";
        }

        return "Others";
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }
}
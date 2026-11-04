package com.monthlybudget.controller;

import com.monthlybudget.model.RecurringExpense;
import com.monthlybudget.service.RecurringExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/recurring")
@Tag(name = "Recurring", description = "Manage recurring expense templates stored in PostgreSQL")
public class RecurringExpenseController {

    private final RecurringExpenseService recurringExpenseService;

    public RecurringExpenseController(RecurringExpenseService recurringExpenseService) {
        this.recurringExpenseService = recurringExpenseService;
    }

    @GetMapping
    @Operation(summary = "List recurring expenses")
    public List<RecurringExpense> list() {
        return recurringExpenseService.listAll();
    }

    @PutMapping
    @Operation(summary = "Replace recurring expenses", description = "Fully replaces the recurring list (editable anytime)")
    public List<RecurringExpense> saveAll(@Valid @RequestBody List<RecurringExpense> body) {
        return recurringExpenseService.saveAll(body);
    }
}

package com.monthlybudget.controller;

import com.monthlybudget.model.CategoryLimit;
import com.monthlybudget.service.CategoryLimitService;
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
@RequestMapping("/api/v1/category-limits")
@Tag(name = "Category Limits", description = "Manage default per-category budget limits applied to monthly sheets")
public class CategoryLimitController {

    private final CategoryLimitService categoryLimitService;

    public CategoryLimitController(CategoryLimitService categoryLimitService) {
        this.categoryLimitService = categoryLimitService;
    }

    @GetMapping
    @Operation(summary = "List category limits")
    public List<CategoryLimit> list() {
        return categoryLimitService.listAll();
    }

    @PutMapping
    @Operation(summary = "Replace category limits", description = "Fully replaces the category-limits list (editable anytime)")
    public List<CategoryLimit> saveAll(@Valid @RequestBody List<CategoryLimit> body) {
        return categoryLimitService.saveAll(body);
    }
}

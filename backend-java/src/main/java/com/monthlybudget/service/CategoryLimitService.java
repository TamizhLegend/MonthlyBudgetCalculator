package com.monthlybudget.service;

import com.monthlybudget.entity.CategoryLimitEntity;
import com.monthlybudget.mapper.MonthMapper;
import com.monthlybudget.model.CategoryLimit;
import com.monthlybudget.repository.CategoryLimitRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class CategoryLimitService {

    private final CategoryLimitRepository categoryLimitRepository;
    private final MonthMapper monthMapper;

    public CategoryLimitService(
            CategoryLimitRepository categoryLimitRepository,
            MonthMapper monthMapper
    ) {
        this.categoryLimitRepository = categoryLimitRepository;
        this.monthMapper = monthMapper;
    }

    @Transactional(readOnly = true)
    public List<CategoryLimit> listAll() {
        return categoryLimitRepository.findAll().stream()
                .map(monthMapper::toCategoryLimitDto)
                .toList();
    }

    /** Replace the full category-limits list (editable anytime). */
    @Transactional
    public List<CategoryLimit> saveAll(List<CategoryLimit> limits) {
        List<CategoryLimit> payload = limits != null ? limits : new ArrayList<>();
        categoryLimitRepository.deleteAllInBatch();
        List<CategoryLimitEntity> entities = payload.stream()
                .map(monthMapper::toCategoryLimitEntity)
                .toList();
        return categoryLimitRepository.saveAll(entities).stream()
                .map(monthMapper::toCategoryLimitDto)
                .toList();
    }
}

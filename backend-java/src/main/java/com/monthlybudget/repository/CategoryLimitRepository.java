package com.monthlybudget.repository;

import com.monthlybudget.entity.CategoryLimitEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryLimitRepository extends JpaRepository<CategoryLimitEntity, String> {
}

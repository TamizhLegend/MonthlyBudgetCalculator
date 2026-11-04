package com.monthlybudget.repository;

import com.monthlybudget.entity.RecurringExpenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecurringExpenseRepository extends JpaRepository<RecurringExpenseEntity, String> {
}

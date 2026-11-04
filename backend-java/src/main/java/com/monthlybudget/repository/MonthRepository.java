package com.monthlybudget.repository;

import com.monthlybudget.entity.MonthEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonthRepository extends JpaRepository<MonthEntity, String> {

    @EntityGraph(attributePaths = {"items", "categoryBudgets"})
    List<MonthEntity> findAllByOrderByYearDescMonthDesc();

    @Override
    @EntityGraph(attributePaths = {"items", "categoryBudgets"})
    Optional<MonthEntity> findById(String id);
}

package com.monthlybudget.mapper;

import com.monthlybudget.entity.CategoryBudgetEntity;
import com.monthlybudget.entity.CategoryLimitEntity;
import com.monthlybudget.entity.ExpenseItemEntity;
import com.monthlybudget.entity.MonthEntity;
import com.monthlybudget.entity.RecurringExpenseEntity;
import com.monthlybudget.model.CategoryLimit;
import com.monthlybudget.model.ExpenseItem;
import com.monthlybudget.model.MonthExpenseData;
import com.monthlybudget.model.RecurringExpense;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class MonthMapper {

    public MonthExpenseData toDto(MonthEntity entity) {
        MonthExpenseData dto = new MonthExpenseData();
        dto.setId(entity.getId());
        dto.setYear(entity.getYear());
        dto.setMonth(entity.getMonth());
        dto.setMonthName(entity.getMonthName());
        dto.setBudget(entity.getBudget());
        dto.setNotes(entity.getNotes());
        dto.setLastUpdated(entity.getLastUpdated() != null ? entity.getLastUpdated().toString() : null);

        List<ExpenseItem> items = new ArrayList<>();
        if (entity.getItems() != null) {
            for (ExpenseItemEntity item : entity.getItems()) {
                items.add(toItemDto(item));
            }
        }
        dto.setItems(items);

        Map<String, Double> budgets = new HashMap<>();
        if (entity.getCategoryBudgets() != null) {
            for (CategoryBudgetEntity budget : entity.getCategoryBudgets()) {
                budgets.put(budget.getCategory(), budget.getBudgetLimit());
            }
        }
        dto.setCategoryBudgets(budgets);
        return dto;
    }

    public void applyDto(MonthEntity entity, MonthExpenseData dto) {
        entity.setId(dto.getId());
        entity.setYear(dto.getYear());
        entity.setMonth(dto.getMonth());
        entity.setMonthName(dto.getMonthName());
        entity.setBudget(dto.getBudget());
        entity.setNotes(dto.getNotes());
        entity.setLastUpdated(Instant.now());

        List<ExpenseItemEntity> items = new ArrayList<>();
        if (dto.getItems() != null) {
            for (ExpenseItem item : dto.getItems()) {
                items.add(toItemEntity(item));
            }
        }
        entity.replaceItems(items);

        List<CategoryBudgetEntity> budgets = new ArrayList<>();
        if (dto.getCategoryBudgets() != null) {
            dto.getCategoryBudgets().forEach((category, limit) -> {
                if (limit == null) {
                    return;
                }
                CategoryBudgetEntity row = new CategoryBudgetEntity();
                row.setCategory(category);
                row.setBudgetLimit(limit);
                budgets.add(row);
            });
        }
        entity.replaceCategoryBudgets(budgets);
    }

    public RecurringExpense toRecurringDto(RecurringExpenseEntity entity) {
        RecurringExpense dto = new RecurringExpense();
        dto.setId(entity.getId());
        dto.setName(entity.getName());
        dto.setCategory(entity.getCategory());
        dto.setAmount(entity.getAmount());
        dto.setDayOfMonth(entity.getDayOfMonth());
        dto.setDescription(entity.getDescription());
        dto.setIsActive(entity.getIsActive());
        return dto;
    }

    public RecurringExpenseEntity toRecurringEntity(RecurringExpense dto) {
        RecurringExpenseEntity entity = new RecurringExpenseEntity();
        entity.setId(StringUtils.hasText(dto.getId()) ? dto.getId() : UUID.randomUUID().toString());
        entity.setName(dto.getName());
        entity.setCategory(dto.getCategory());
        entity.setAmount(dto.getAmount());
        entity.setDayOfMonth(dto.getDayOfMonth());
        entity.setDescription(dto.getDescription());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : Boolean.TRUE);
        return entity;
    }

    public CategoryLimit toCategoryLimitDto(CategoryLimitEntity entity) {
        CategoryLimit dto = new CategoryLimit();
        dto.setId(entity.getId());
        dto.setCategory(entity.getCategory());
        dto.setBudgetLimit(entity.getBudgetLimit());
        dto.setIsActive(entity.getIsActive());
        return dto;
    }

    public CategoryLimitEntity toCategoryLimitEntity(CategoryLimit dto) {
        CategoryLimitEntity entity = new CategoryLimitEntity();
        entity.setId(StringUtils.hasText(dto.getId()) ? dto.getId() : UUID.randomUUID().toString());
        entity.setCategory(dto.getCategory());
        entity.setBudgetLimit(dto.getBudgetLimit());
        entity.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : Boolean.TRUE);
        return entity;
    }

    private ExpenseItem toItemDto(ExpenseItemEntity entity) {
        ExpenseItem dto = new ExpenseItem();
        dto.setId(entity.getId());
        dto.setDate(entity.getDate() != null ? entity.getDate().toString() : null);
        dto.setCategory(entity.getCategory());
        dto.setAmount(entity.getAmount());
        dto.setDescription(entity.getDescription());
        return dto;
    }

    private ExpenseItemEntity toItemEntity(ExpenseItem dto) {
        ExpenseItemEntity entity = new ExpenseItemEntity();
        entity.setId(StringUtils.hasText(dto.getId()) ? dto.getId() : UUID.randomUUID().toString());
        entity.setDate(LocalDate.parse(dto.getDate()));
        entity.setCategory(dto.getCategory());
        entity.setAmount(dto.getAmount());
        entity.setDescription(dto.getDescription());
        return entity;
    }
}

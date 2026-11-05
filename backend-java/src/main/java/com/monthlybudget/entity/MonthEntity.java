package com.monthlybudget.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Entity
@Table(name = "months")
public class MonthEntity {

    @Id
    @Column(length = 7)
    private String id;

    @Column(nullable = false)
    private Integer year;

    @Column(nullable = false)
    private Integer month;

    @Column(name = "month_name", nullable = false, length = 20)
    private String monthName;

    private Double budget;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "last_updated", nullable = false)
    private Instant lastUpdated;

    /**
     * Set (not List): EntityGraph join-fetches items + categoryBudgets together, which
     * multiplies SQL rows (cartesian product). A List keeps every duplicate row;
     * a Set collapses them by entity identity.
     */
    @OneToMany(mappedBy = "month", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("date ASC, id ASC")
    private Set<ExpenseItemEntity> items = new LinkedHashSet<>();

    /** Set so Hibernate can join-fetch both collections without MultipleBagFetchException. */
    @OneToMany(mappedBy = "month", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<CategoryBudgetEntity> categoryBudgets = new HashSet<>();

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public String getMonthName() {
        return monthName;
    }

    public void setMonthName(String monthName) {
        this.monthName = monthName;
    }

    public Double getBudget() {
        return budget;
    }

    public void setBudget(Double budget) {
        this.budget = budget;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(Instant lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public Set<ExpenseItemEntity> getItems() {
        return items;
    }

    public void setItems(Set<ExpenseItemEntity> items) {
        this.items = items;
    }

    public Set<CategoryBudgetEntity> getCategoryBudgets() {
        return categoryBudgets;
    }

    public void setCategoryBudgets(Set<CategoryBudgetEntity> categoryBudgets) {
        this.categoryBudgets = categoryBudgets;
    }

    public void replaceItems(List<ExpenseItemEntity> newItems) {
        items.clear();
        if (newItems != null) {
            for (ExpenseItemEntity item : newItems) {
                item.setMonth(this);
                items.add(item);
            }
        }
    }

    /**
     * Merge category budgets in place (update / remove / insert) so Hibernate does not
     * INSERT before DELETE against uk_month_category.
     */
    public void replaceCategoryBudgets(List<CategoryBudgetEntity> newBudgets) {
        Map<String, Double> desired = new LinkedHashMap<>();
        if (newBudgets != null) {
            for (CategoryBudgetEntity budgetRow : newBudgets) {
                if (budgetRow.getCategory() == null || budgetRow.getBudgetLimit() == null) {
                    continue;
                }
                desired.put(budgetRow.getCategory(), budgetRow.getBudgetLimit());
            }
        }

        categoryBudgets.removeIf(existing -> !desired.containsKey(existing.getCategory()));

        Map<String, CategoryBudgetEntity> byCategory = new HashMap<>();
        for (CategoryBudgetEntity existing : categoryBudgets) {
            byCategory.put(existing.getCategory(), existing);
            existing.setBudgetLimit(desired.get(existing.getCategory()));
        }

        desired.forEach((category, limit) -> {
            if (byCategory.containsKey(category)) {
                return;
            }
            CategoryBudgetEntity row = new CategoryBudgetEntity();
            row.setCategory(category);
            row.setBudgetLimit(limit);
            row.setMonth(this);
            categoryBudgets.add(row);
        });
    }
}

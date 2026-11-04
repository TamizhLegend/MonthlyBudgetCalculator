package com.monthlybudget.service;

import com.monthlybudget.entity.RecurringExpenseEntity;
import com.monthlybudget.mapper.MonthMapper;
import com.monthlybudget.model.RecurringExpense;
import com.monthlybudget.repository.RecurringExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class RecurringExpenseService {

    private final RecurringExpenseRepository recurringExpenseRepository;
    private final MonthMapper monthMapper;

    public RecurringExpenseService(
            RecurringExpenseRepository recurringExpenseRepository,
            MonthMapper monthMapper
    ) {
        this.recurringExpenseRepository = recurringExpenseRepository;
        this.monthMapper = monthMapper;
    }

    @Transactional(readOnly = true)
    public List<RecurringExpense> listAll() {
        return recurringExpenseRepository.findAll().stream()
                .map(monthMapper::toRecurringDto)
                .toList();
    }

    /** Replace the full recurring list (editable anytime). */
    @Transactional
    public List<RecurringExpense> saveAll(List<RecurringExpense> expenses) {
        List<RecurringExpense> payload = expenses != null ? expenses : new ArrayList<>();
        recurringExpenseRepository.deleteAllInBatch();
        List<RecurringExpenseEntity> entities = payload.stream()
                .map(monthMapper::toRecurringEntity)
                .toList();
        return recurringExpenseRepository.saveAll(entities).stream()
                .map(monthMapper::toRecurringDto)
                .toList();
    }
}

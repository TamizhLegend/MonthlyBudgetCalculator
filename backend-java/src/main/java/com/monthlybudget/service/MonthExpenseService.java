package com.monthlybudget.service;

import com.monthlybudget.entity.MonthEntity;
import com.monthlybudget.exception.ApiException;
import com.monthlybudget.mapper.MonthMapper;
import com.monthlybudget.model.MonthExpenseData;
import com.monthlybudget.repository.MonthRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class MonthExpenseService {

    private static final Pattern MONTH_ID = Pattern.compile("^\\d{4}-(0[1-9]|1[0-2])$");

    private final MonthRepository monthRepository;
    private final MonthMapper monthMapper;

    public MonthExpenseService(MonthRepository monthRepository, MonthMapper monthMapper) {
        this.monthRepository = monthRepository;
        this.monthMapper = monthMapper;
    }

    @Transactional(readOnly = true)
    public List<MonthExpenseData> listAll() {
        return monthRepository.findAllByOrderByYearDescMonthDesc().stream()
                .map(monthMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public MonthExpenseData getById(String id) {
        validateId(id);
        MonthEntity entity = monthRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Month not found: " + id));
        return monthMapper.toDto(entity);
    }

    @Transactional
    public MonthExpenseData create(MonthExpenseData request) {
        MonthExpenseData normalized = normalize(request, null);
        if (monthRepository.existsById(normalized.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Month already exists: " + normalized.getId()
                    + ". Use PUT /api/v1/months/{id} to update.");
        }
        MonthEntity entity = new MonthEntity();
        monthMapper.applyDto(entity, normalized);
        return monthMapper.toDto(monthRepository.save(entity));
    }

    @Transactional
    public MonthExpenseData upsert(String id, MonthExpenseData request) {
        validateId(id);
        if (StringUtils.hasText(request.getId()) && !id.equals(request.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Path id and body id must match.");
        }
        request.setId(id);
        MonthExpenseData normalized = normalize(request, id);

        MonthEntity entity = monthRepository.findById(id).orElseGet(MonthEntity::new);
        monthMapper.applyDto(entity, normalized);
        return monthMapper.toDto(monthRepository.save(entity));
    }

    @Transactional
    public void delete(String id) {
        validateId(id);
        if (!monthRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Month not found: " + id);
        }
        monthRepository.deleteById(id);
    }

    private MonthExpenseData normalize(MonthExpenseData request, String pathId) {
        if (request.getItems() == null) {
            request.setItems(new ArrayList<>());
        }
        if (!StringUtils.hasText(request.getId())) {
            if (pathId != null) {
                request.setId(pathId);
            } else if (request.getYear() != null && request.getMonth() != null) {
                request.setId(String.format("%04d-%02d", request.getYear(), request.getMonth()));
            }
        }
        validateId(request.getId());

        if (request.getYear() == null || request.getMonth() == null) {
            String[] parts = request.getId().split("-");
            request.setYear(Integer.parseInt(parts[0]));
            request.setMonth(Integer.parseInt(parts[1]));
        }

        String expectedId = String.format("%04d-%02d", request.getYear(), request.getMonth());
        if (!expectedId.equals(request.getId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "id must match year/month (expected " + expectedId + ").");
        }
        return request;
    }

    private void validateId(String id) {
        if (!StringUtils.hasText(id) || !MONTH_ID.matcher(id).matches()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Invalid month id. Expected format YYYY-MM (e.g. 2025-01).");
        }
    }
}

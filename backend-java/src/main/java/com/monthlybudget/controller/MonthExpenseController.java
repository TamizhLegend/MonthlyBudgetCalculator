package com.monthlybudget.controller;

import com.monthlybudget.model.MonthExpenseData;
import com.monthlybudget.service.MonthExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/months")
@Tag(name = "Months", description = "Create, read, update, and delete monthly expense records in PostgreSQL")
public class MonthExpenseController {

    private final MonthExpenseService monthExpenseService;

    public MonthExpenseController(MonthExpenseService monthExpenseService) {
        this.monthExpenseService = monthExpenseService;
    }

    @GetMapping
    @Operation(summary = "List all months", description = "Returns every month with expense items and category budgets from the database")
    @ApiResponse(responseCode = "200", description = "List of months")
    public List<MonthExpenseData> listMonths() {
        return monthExpenseService.listAll();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one month", description = "Fetch a single month by id (YYYY-MM)")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Month found"),
            @ApiResponse(responseCode = "404", description = "Month not found", content = @Content)
    })
    public MonthExpenseData getMonth(
            @Parameter(description = "Month id, e.g. 2025-01", example = "2025-01")
            @PathVariable String id
    ) {
        return monthExpenseService.getById(id);
    }

    @PostMapping
    @Operation(summary = "Create month", description = "Creates a new month. Returns 409 if it already exists.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Created",
                    content = @Content(schema = @Schema(implementation = MonthExpenseData.class))),
            @ApiResponse(responseCode = "409", description = "Already exists", content = @Content)
    })
    public ResponseEntity<MonthExpenseData> createMonth(@Valid @RequestBody MonthExpenseData body) {
        MonthExpenseData created = monthExpenseService.create(body);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(
            summary = "Create or edit month",
            description = "Upsert: creates the month if missing, or fully replaces it when editing later"
    )
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Saved",
                    content = @Content(schema = @Schema(implementation = MonthExpenseData.class))),
            @ApiResponse(responseCode = "400", description = "Invalid payload", content = @Content)
    })
    public MonthExpenseData upsertMonth(
            @Parameter(description = "Month id, e.g. 2025-01", example = "2025-01")
            @PathVariable String id,
            @Valid @RequestBody MonthExpenseData body
    ) {
        return monthExpenseService.upsert(id, body);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete month", description = "Removes the month and its related expense rows from the database")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Deleted"),
            @ApiResponse(responseCode = "404", description = "Month not found", content = @Content)
    })
    public ResponseEntity<Map<String, String>> deleteMonth(
            @Parameter(description = "Month id, e.g. 2025-01", example = "2025-01")
            @PathVariable String id
    ) {
        monthExpenseService.delete(id);
        return ResponseEntity.ok(Map.of("message", "Deleted " + id));
    }
}

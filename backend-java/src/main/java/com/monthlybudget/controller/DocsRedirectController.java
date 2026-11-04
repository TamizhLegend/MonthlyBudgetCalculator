package com.monthlybudget.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Friendly shortcuts so Swagger opens reliably in the browser.
 */
@Controller
public class DocsRedirectController {

    @GetMapping({"/", "/docs", "/swagger", "/swagger-ui"})
    public String swaggerUi() {
        return "redirect:/swagger-ui/index.html";
    }
}

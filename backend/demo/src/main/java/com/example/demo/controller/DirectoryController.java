package com.example.demo.controller;

import com.example.demo.entity.DirectoryEntry;
import com.example.demo.service.DirectoryService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/directory")
public class DirectoryController {

    private final DirectoryService directoryService;

    public DirectoryController(DirectoryService directoryService) {
        this.directoryService = directoryService;
    }

    @GetMapping("/search")
    public Page<DirectoryEntry> searchDirectory(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) String ngoSpecialization,
            @RequestParam(required = false) Integer minExperience,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return directoryService.searchDirectory(type, name, state, district, specialization, ngoSpecialization,
                minExperience, page, size);
    }

    @GetMapping("/{id}")
    public DirectoryEntry getById(@PathVariable("id") Integer id) {
        return directoryService.getById(id);
    }
}

package com.example.demo.controller;

import com.example.demo.entity.Lawyer;
import com.example.demo.entity.NGO;
import com.example.demo.repository.LawyerRepository;
import com.example.demo.repository.NGORepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private final LawyerRepository lawyerRepo;
    private final NGORepository ngoRepo;

    public DebugController(LawyerRepository lawyerRepo, NGORepository ngoRepo) {
        this.lawyerRepo = lawyerRepo;
        this.ngoRepo = ngoRepo;
    }

    @GetMapping("/credentials")
    public Map<String, Object> getCredentials(@RequestParam(required = false) String name) {
        List<Map<String, String>> lawyers = lawyerRepo.findAll().stream()
                .filter(l -> name == null || l.getFullName().toLowerCase().contains(name.toLowerCase()))
                .map(l -> Map.of(
                        "name", l.getFullName(),
                        "email", l.getEmail(),
                        "password", l.getPassword()))
                .collect(Collectors.toList());

        List<Map<String, String>> ngos = ngoRepo.findAll().stream()
                .filter(n -> name == null || n.getNgoName().toLowerCase().contains(name.toLowerCase()))
                .map(n -> Map.of(
                        "name", n.getNgoName(),
                        "email", n.getEmail(),
                        "password", n.getPassword()))
                .collect(Collectors.toList());

        return Map.of(
                "lawyers", lawyers,
                "ngos", ngos);
    }
}

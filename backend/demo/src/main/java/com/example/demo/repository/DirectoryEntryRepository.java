package com.example.demo.repository;

import com.example.demo.entity.DirectoryEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DirectoryEntryRepository extends JpaRepository<DirectoryEntry, Integer> {

  @Query(value = """
      SELECT * FROM directory_entries
      WHERE (approved = true)
        AND (CAST(:type AS text) IS NULL OR type = CAST(:type AS text))
        AND (CAST(:name AS text) IS NULL OR LOWER(CAST(name AS text)) LIKE CAST(:name AS text))
        AND (CAST(:state AS text) IS NULL OR state = CAST(:state AS text))
        AND (CAST(:district AS text) IS NULL OR (LOWER(CAST(district AS text)) LIKE CAST(:district AS text) OR LOWER(CAST(state AS text)) LIKE CAST(:district AS text) OR LOWER(CAST(city AS text)) LIKE CAST(:district AS text)))
        AND (
          (CAST(:specialization AS text) IS NULL AND CAST(:ngoSpec AS text) IS NULL)
          OR
          (CAST(:specialization AS text) IS NOT NULL AND LOWER(CAST(specialization AS text)) LIKE LOWER(CONCAT('%', CAST(:specialization AS text), '%')))
          OR
          (CAST(:ngoSpec AS text) IS NOT NULL AND LOWER(CAST(specialization AS text)) LIKE LOWER(CONCAT('%', CAST(:ngoSpec AS text), '%')))
        )
        AND (:minExperience IS NULL OR experience_years >= :minExperience)
      """, countQuery = """
      SELECT count(*) FROM directory_entries
      WHERE (approved = true)
        AND (CAST(:type AS text) IS NULL OR type = CAST(:type AS text))
        AND (CAST(:name AS text) IS NULL OR LOWER(CAST(name AS text)) LIKE CAST(:name AS text))
        AND (CAST(:state AS text) IS NULL OR state = CAST(:state AS text))
        AND (CAST(:district AS text) IS NULL OR (LOWER(CAST(district AS text)) LIKE CAST(:district AS text) OR LOWER(CAST(state AS text)) LIKE CAST(:district AS text) OR LOWER(CAST(city AS text)) LIKE CAST(:district AS text)))
        AND (
          (CAST(:specialization AS text) IS NULL AND CAST(:ngoSpec AS text) IS NULL)
          OR
          (CAST(:specialization AS text) IS NOT NULL AND LOWER(CAST(specialization AS text)) LIKE LOWER(CONCAT('%', CAST(:specialization AS text), '%')))
          OR
          (CAST(:ngoSpec AS text) IS NOT NULL AND LOWER(CAST(specialization AS text)) LIKE LOWER(CONCAT('%', CAST(:ngoSpec AS text), '%')))
        )
        AND (:minExperience IS NULL OR experience_years >= :minExperience)
      """, nativeQuery = true)
  Page<DirectoryEntry> searchDirectory(
      @Param("type") String type,
      @Param("name") String name,
      @Param("state") String state,
      @Param("district") String district,
      @Param("specialization") String specialization,
      @Param("ngoSpec") String ngoSpec,
      @Param("minExperience") Integer minExperience,
      Pageable pageable);

  // Find entry to sync updates
  DirectoryEntry findByTypeAndRegistrationNumber(String type, String registrationNumber);

  DirectoryEntry findByTypeAndBarCouncilId(String type, String barCouncilId);

  // for lawyer verification: directory has LAWYER entries with barCouncilId
  boolean existsByTypeAndBarCouncilId(String type, String barCouncilId);

  // for NGO verification: directory has NGO entries with registrationNumber
  boolean existsByTypeAndRegistrationNumber(String type, String registrationNumber);

  java.util.List<DirectoryEntry> findAllByContactEmail(String email);

  DirectoryEntry findByTypeAndOriginalId(String type, Integer originalId);
}

package com.drivelink.backend.repository;

import com.drivelink.backend.model.MedicalCentre;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MedicalCentreRepository extends JpaRepository<MedicalCentre, Long> {
    List<MedicalCentre> findByCity(String city);
}

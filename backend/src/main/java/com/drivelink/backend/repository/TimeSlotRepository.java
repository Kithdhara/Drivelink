package com.drivelink.backend.repository;

import com.drivelink.backend.model.TimeSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimeSlotRepository extends JpaRepository<TimeSlot, Long> {
    List<TimeSlot> findByTypeAndDateGreaterThanEqual(String type, String date);
    List<TimeSlot> findByType(String type);
    List<TimeSlot> findByCentreIdAndType(Long centreId, String type);
}

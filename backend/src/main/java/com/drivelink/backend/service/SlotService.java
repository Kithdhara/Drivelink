package com.drivelink.backend.service;

import com.drivelink.backend.model.TimeSlot;
import com.drivelink.backend.repository.TimeSlotRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class SlotService {

    private final TimeSlotRepository slotRepo;

    public SlotService(TimeSlotRepository slotRepo) {
        this.slotRepo = slotRepo;
    }

    public TimeSlot create(TimeSlot slot) {
        slot.setBooked(0);
        if (slot.getCity() == null || slot.getCity().trim().isEmpty()) {
            slot.setCity(deriveCity(slot.getCentreName()));
        }
        return slotRepo.save(slot);
    }

    private String deriveCity(String centreName) {
        if (centreName == null) return "Colombo";
        String lower = centreName.toLowerCase();
        if (lower.contains("werahera")) return "Werahera";
        if (lower.contains("nugegoda")) return "Nugegoda";
        if (lower.contains("colombo")) return "Colombo";
        if (lower.contains("gampaha")) return "Gampaha";
        if (lower.contains("kandy")) return "Kandy";
        if (lower.contains("kurunegala")) return "Kurunegala";
        if (lower.contains("galle")) return "Galle";
        if (lower.contains("anuradhapura")) return "Anuradhapura";
        return "Colombo";
    }

    public List<TimeSlot> getAvailableSlots(String type) {
        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        List<TimeSlot> slots = slotRepo.findByTypeAndDateGreaterThanEqual(type, today);
        for (TimeSlot s : slots) {
            if (s.getCity() == null || s.getCity().trim().isEmpty()) {
                s.setCity(deriveCity(s.getCentreName()));
            }
        }
        return slots;
    }

    public List<TimeSlot> getSlotsByType(String type) {
        return slotRepo.findByType(type);
    }

    public List<TimeSlot> getAll() {
        return slotRepo.findAll();
    }

    public TimeSlot update(Long id, TimeSlot updated) {
        TimeSlot slot = slotRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (updated.getDate() != null) slot.setDate(updated.getDate());
        if (updated.getStartTime() != null) slot.setStartTime(updated.getStartTime());
        if (updated.getEndTime() != null) slot.setEndTime(updated.getEndTime());
        if (updated.getCapacity() > 0) slot.setCapacity(updated.getCapacity());
        if (updated.getCentreName() != null) slot.setCentreName(updated.getCentreName());

        return slotRepo.save(slot);
    }

    public void delete(Long id) {
        TimeSlot slot = slotRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Slot not found"));

        if (slot.getBooked() > 0) {
            throw new RuntimeException("Cannot delete a slot that has active bookings");
        }

        slotRepo.deleteById(id);
    }
}

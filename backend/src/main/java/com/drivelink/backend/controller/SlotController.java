package com.drivelink.backend.controller;

import com.drivelink.backend.model.TimeSlot;
import com.drivelink.backend.model.MedicalCentre;
import com.drivelink.backend.repository.MedicalCentreRepository;
import com.drivelink.backend.service.SlotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/slots")
public class SlotController {

    private final SlotService slotService;
    private final MedicalCentreRepository centreRepo;

    public SlotController(SlotService slotService, MedicalCentreRepository centreRepo) {
        this.slotService = slotService;
        this.centreRepo = centreRepo;
    }

    // POST /api/slots — Create a time slot
    @PostMapping
    public ResponseEntity<?> create(@RequestBody TimeSlot slot) {
        try {
            return ResponseEntity.ok(slotService.create(slot));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // GET /api/slots?type=MEDICAL — Get available slots by type
    @GetMapping
    public ResponseEntity<?> getAvailable(@RequestParam(required = false) String type) {
        if (type != null) {
            return ResponseEntity.ok(slotService.getAvailableSlots(type.toUpperCase()));
        }
        return ResponseEntity.ok(slotService.getAll());
    }

    // PUT /api/slots/{id}
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody TimeSlot slot) {
        try {
            return ResponseEntity.ok(slotService.update(id, slot));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // DELETE /api/slots/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            slotService.delete(id);
            return ResponseEntity.ok("Slot deleted");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // ─── Medical Centres ───

    // POST /api/slots/centres
    @PostMapping("/centres")
    public ResponseEntity<?> createCentre(@RequestBody MedicalCentre centre) {
        return ResponseEntity.ok(centreRepo.save(centre));
    }

    // GET /api/slots/centres
    @GetMapping("/centres")
    public ResponseEntity<?> getAllCentres() {
        return ResponseEntity.ok(centreRepo.findAll());
    }

    // GET /api/slots/centres/{city}
    @GetMapping("/centres/{city}")
    public ResponseEntity<?> getCentresByCity(@PathVariable String city) {
        return ResponseEntity.ok(centreRepo.findByCity(city));
    }
}

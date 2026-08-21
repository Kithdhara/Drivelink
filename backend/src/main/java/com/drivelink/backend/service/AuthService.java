package com.drivelink.backend.service;

import com.drivelink.backend.dto.LoginRequest;
import com.drivelink.backend.dto.RegisterRequest;
import com.drivelink.backend.model.User;
import com.drivelink.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }
        if (userRepository.findByNic(request.getNic()).isPresent()) {
            throw new RuntimeException("NIC already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setNic(request.getNic());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setActive(true);

        User saved = userRepository.save(user);
        saved.setPassword("");
        return saved;
    }

    public User loginUser(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String storedPassword = user.getPassword();
            
            boolean isMatch = false;
            boolean needsUpgrade = false;
            
            if (storedPassword != null && storedPassword.startsWith("$2a$")) {
                isMatch = passwordEncoder.matches(request.getPassword(), storedPassword);
            } else {
                isMatch = request.getPassword().equals(storedPassword);
                if (isMatch) {
                    needsUpgrade = true;
                }
            }
            
            if (isMatch) {
                if (needsUpgrade) {
                    user.setPassword(passwordEncoder.encode(request.getPassword()));
                    user = userRepository.save(user);
                }
                user.setPassword("");
                return user;
            }
        }
        throw new RuntimeException("Invalid email or password");
    }

    public User updateProfile(String userId, Map<String, String> updates) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updates.containsKey("name") && updates.get("name") != null)
            user.setName(updates.get("name"));
        if (updates.containsKey("phone") && updates.get("phone") != null)
            user.setPhone(updates.get("phone"));
        if (updates.containsKey("address") && updates.get("address") != null)
            user.setAddress(updates.get("address"));
        if (updates.containsKey("dob") && updates.get("dob") != null)
            user.setDob(updates.get("dob"));
        if (updates.containsKey("gender") && updates.get("gender") != null)
            user.setGender(updates.get("gender"));
        if (updates.containsKey("newPassword") && updates.get("newPassword") != null
                && !updates.get("newPassword").isEmpty()) {
            String currentPassword = updates.get("currentPassword");
            if (currentPassword == null || !passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(updates.get("newPassword")));
        }

        User saved = userRepository.save(user);
        saved.setPassword("");
        return saved;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll().stream()
            .map(u -> { u.setPassword(""); return u; })
            .collect(java.util.stream.Collectors.toList());
    }

    public User adminCreateUser(Map<String, Object> body) {
        String email = body.get("email") != null ? body.get("email").toString().trim() : null;
        String nic = body.get("nic") != null ? body.get("nic").toString().trim() : null;
        if (email == null || email.isBlank()) throw new RuntimeException("Email is required");
        if (nic == null || nic.isBlank()) throw new RuntimeException("NIC is required");
        if (userRepository.findByEmail(email).isPresent()) throw new RuntimeException("Email already exists");
        if (userRepository.findByNic(nic).isPresent()) throw new RuntimeException("NIC already exists");

        String phone = body.get("phone") != null ? body.get("phone").toString().trim() : "";
        if (!phone.isEmpty() && !phone.matches("^07[0-9]{8}$")) {
            throw new RuntimeException("Invalid phone number. Use format 07XXXXXXXX");
        }

        User user = new User();
        user.setName(body.get("name") != null ? body.get("name").toString() : "");
        user.setEmail(email);
        user.setNic(nic);
        user.setPhone(phone);
        String pwd = body.get("password") != null ? body.get("password").toString() : "Password123!";
        user.setPassword(passwordEncoder.encode(pwd));
        com.drivelink.backend.model.Role role;
        try {
            String roleStr = body.get("role") != null ? body.get("role").toString() : "APPLICANT";
            role = com.drivelink.backend.model.Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            role = com.drivelink.backend.model.Role.APPLICANT;
        }
        user.setRole(role);
        user.setActive(true);
        User saved = userRepository.save(user);
        saved.setPassword("");
        return saved;
    }

    public User setUserActive(String userId, boolean active) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setActive(active);
        User saved = userRepository.save(user);
        saved.setPassword("");
        return saved;
    }

    public User adminUpdateUser(String userId, Map<String, Object> updates) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (updates.containsKey("name") && updates.get("name") != null) {
            user.setName(updates.get("name").toString());
        }
        if (updates.containsKey("email") && updates.get("email") != null) {
            String newEmail = updates.get("email").toString().trim();
            if (!newEmail.equalsIgnoreCase(user.getEmail()) && userRepository.findByEmail(newEmail).isPresent()) {
                throw new RuntimeException("Email already exists");
            }
            user.setEmail(newEmail);
        }
        if (updates.containsKey("nic") && updates.get("nic") != null) {
            String newNic = updates.get("nic").toString().trim();
            if (!newNic.equalsIgnoreCase(user.getNic()) && userRepository.findByNic(newNic).isPresent()) {
                throw new RuntimeException("NIC already exists");
            }
            user.setNic(newNic);
        }
        if (updates.containsKey("phone") && updates.get("phone") != null) {
            String phone = updates.get("phone").toString().trim();
            if (!phone.isEmpty() && !phone.matches("^07[0-9]{8}$")) {
                throw new RuntimeException("Invalid phone number. Use format 07XXXXXXXX");
            }
            user.setPhone(phone);
        }
        if (updates.containsKey("role") && updates.get("role") != null) {
            try {
                user.setRole(com.drivelink.backend.model.Role.valueOf(updates.get("role").toString().toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }
        if (updates.containsKey("active") && updates.get("active") != null) {
            Object act = updates.get("active");
            if (act instanceof Boolean) {
                user.setActive((Boolean) act);
            } else {
                user.setActive(Boolean.parseBoolean(act.toString()));
            }
        }
        User saved = userRepository.save(user);
        saved.setPassword("");
        return saved;
    }

    public User getUserById(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword("");
        return user;
    }
}

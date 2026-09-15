package com.drivelink.backend.service;

import com.drivelink.backend.dto.LoginRequest;
import com.drivelink.backend.dto.RegisterRequest;
import com.drivelink.backend.model.User;
import com.drivelink.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User registerUser(RegisterRequest request) {
        // Check if email or nic exists
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
        user.setPassword(request.getPassword()); // In a real app, hash this with BCrypt!
        user.setRole(request.getRole());
        user.setActive(true);

        return userRepository.save(user);
    }

    public User loginUser(LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(request.getPassword())) {
            return userOpt.get(); // In a real app, return a JWT token!
        }
        throw new RuntimeException("Invalid email or password");
    }
}

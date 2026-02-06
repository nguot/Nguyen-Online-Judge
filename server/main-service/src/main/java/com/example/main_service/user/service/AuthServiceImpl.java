package com.example.main_service.user.service;

import com.example.main_service.rbac.RbacService;
import com.example.main_service.security.InputValidator;
import com.example.main_service.user.dto.LoginRequest;
import com.example.main_service.user.dto.LoginResponse;
import com.example.main_service.user.dto.RegisterRequest;
import com.example.main_service.user.dto.RegisterResponse;
import com.example.main_service.user.model.UserEntity;
import com.example.main_service.user.repo.UserRepo;

import com.example.main_service.user.security.JwtAccessTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@RequiredArgsConstructor
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepo userRepo;
    private final TokenServiceImpl tokenService;
    private final BCryptPasswordEncoder encoder;
    private final JwtAccessTokenProvider accessProvider;
    private final RbacService rbacService;

    public RegisterResponse register(RegisterRequest req) {
        String username = InputValidator.normalizeUsername(req.getUserName());
        String email = InputValidator.normalizeEmail(req.getEmail());
        String password = req.getPassword();

        //InputValidator.validateRegister(username, email, password);
        UserEntity currentUser = userRepo.findByUserName(username).orElse(null);
        if(currentUser!=null) throw new RuntimeException("USERNAME_OR_EMAIL_ALREADY_EXISTS");

        UserEntity u = new UserEntity();
        u.setUserName(username);
        u.setEmail(email);
        u.setPassword(encoder.encode(password));

        UserEntity saved = userRepo.save(u);
        return new RegisterResponse(
                saved.getUserId(), req.getUserName(), req.getEmail()
        );
    }

    public LoginResponse login(LoginRequest req, String ipAddr) {
        String username = InputValidator.normalizeUsername(req.getUserName());
        String password = req.getPassword();

        InputValidator.validateLogin(username, password);

        UserEntity user = userRepo.findByUserName(username).orElse(null);
        if (user == null || !encoder.matches(password, user.getPassword())) {
            throw new RuntimeException("INVALID_CREDENTIALS");
        }

        String accessToken = accessProvider.generate(user.getUserId());
        String refreshToken = tokenService.createRefreshToken(user.getUserId(), ipAddr);

        LoginResponse res = new LoginResponse();
        res.setAccessToken(accessToken);
        res.setRefreshToken(refreshToken);
        res.setExpiresIn(tokenService.getAccessTokenExpiry());
        res.setIsAdmin(rbacService.isAdmin(user.getUserId()));
        res.setUserId(user.getUserId());
        res.setIsProUser(rbacService.isProUser(user.getUserId()));
        return res;
    }
}

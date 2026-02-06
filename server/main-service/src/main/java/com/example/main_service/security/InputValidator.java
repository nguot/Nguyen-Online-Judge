package com.example.main_service.security;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class InputValidator {
    private static final int USERNAME_MIN = 3;
    private static final int USERNAME_MAX = 32;
    private static final int EMAIL_MAX = 254;
    private static final int PASSWORD_MIN = 8;
    private static final int PASSWORD_MAX = 72; // BCrypt effective limit

    // Cho phép: a-z A-Z 0-9 . _ -
    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[a-zA-Z0-9._-]+$");

    // Chặn control chars + DEL
    private static boolean hasControlChars(String s) {
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (Character.isISOControl(c) || c == 0x7F) return true;
        }
        return false;
    }

    public static String normalizeUsername(String raw) {
        if (raw == null) return null;
        // NFKC để giảm Unicode confusable kiểu fullwidth
        String s = Normalizer.normalize(raw, Normalizer.Form.NFKC).trim();
        // Optional: ép lowercase để tránh "Admin" vs "admin"
        // s = s.toLowerCase(Locale.ROOT);
        return s;
    }

    public static String normalizeEmail(String raw) {
        if (raw == null) return null;
        String s = Normalizer.normalize(raw, Normalizer.Form.NFKC).trim();
        return s.toLowerCase(java.util.Locale.ROOT);
    }

    public static void validateRegister(String username, String email, String password) {
        if (username == null || username.isBlank())
            throw new IllegalArgumentException("INVALID_USERNAME");
        if (email == null || email.isBlank())
            throw new IllegalArgumentException("INVALID_EMAIL");
        if (password == null)
            throw new IllegalArgumentException("INVALID_PASSWORD");

        if (username.length() < USERNAME_MIN || username.length() > USERNAME_MAX)
            throw new IllegalArgumentException("INVALID_USERNAME");
        if (!USERNAME_PATTERN.matcher(username).matches())
            throw new IllegalArgumentException("INVALID_USERNAME");
        if (hasControlChars(username))
            throw new IllegalArgumentException("INVALID_USERNAME");

        if (email.length() > EMAIL_MAX || hasControlChars(email))
            throw new IllegalArgumentException("INVALID_EMAIL");
        // tối thiểu: có @ và .
        if (!email.contains("@") || email.lastIndexOf('.') < email.indexOf('@'))
            throw new IllegalArgumentException("INVALID_EMAIL");

        if (password.length() < PASSWORD_MIN || password.length() > PASSWORD_MAX)
            throw new IllegalArgumentException("INVALID_PASSWORD");
        if (hasControlChars(password))
            throw new IllegalArgumentException("INVALID_PASSWORD");
    }

    public static void validateLogin(String username, String password) {
        if (username == null || password == null) {
            throw new IllegalArgumentException("INVALID_CREDENTIALS1111111");
        }
        String u = normalizeUsername(username);
        if (u == null || u.isBlank() || u.length() > USERNAME_MAX || hasControlChars(u))
            throw new IllegalArgumentException("INVALID_CREDENTIALS");
        if (password.length() > PASSWORD_MAX || hasControlChars(password))
            throw new IllegalArgumentException("INVALID_CREDENTIALS");
    }
}


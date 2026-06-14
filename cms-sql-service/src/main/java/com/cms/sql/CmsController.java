package com.cms.sql;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Date;
import javax.crypto.SecretKey;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/sql")
@CrossOrigin(origins = "*")
public class CmsController {

    @PersistenceContext
    private EntityManager entityManager;

    // ─────────────────────────────────────────
    // JWT CONFIG
    // Secret key must be at least 32 characters
    // ─────────────────────────────────────────
    private static final String JWT_SECRET = "cms_project_secret_key_dbms_2024_secure";
    private static final long JWT_EXPIRY_MS = 86400000; // 24 hours

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(JWT_SECRET.getBytes(StandardCharsets.UTF_8));
    }

    // Generate JWT token with userId, email, role embedded
    private String generateToken(Long userId, String email, String role) {
        return Jwts.builder()
            .subject(email)
            .claim("userId", userId)
            .claim("role", role)
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + JWT_EXPIRY_MS))
            .signWith(getSigningKey())
            .compact();
    }

    // Validate JWT and extract all claims
    private Claims validateToken(String token) {
        return Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    // Extract token from Authorization header: "Bearer <token>"
    private String extractToken(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        return null;
    }

    // ─────────────────────────────────────────
    // AUTH ENDPOINTS
    // ─────────────────────────────────────────

    @PostMapping("/signup")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> signUp(@RequestBody User user) {
        Map<String, Object> response = new HashMap<>();
        try {
            Long count = (Long) entityManager
                .createQuery("SELECT COUNT(u) FROM User u WHERE u.email = :email")
                .setParameter("email", user.getEmail())
                .getSingleResult();

            if (count > 0) {
                response.put("error", "Email already registered. Please sign in.");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            user.setCreatedAt(LocalDateTime.now());
            // Default role is USER unless explicitly set to ADMIN
            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("USER");
            }

            entityManager.persist(user);
            entityManager.flush();

            response.put("message", "User registered successfully");
            response.put("userId", user.getUserId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("error", "Signup failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody User loginUser) {
        Map<String, Object> response = new HashMap<>();
        try {
            User user = (User) entityManager
                .createQuery("SELECT u FROM User u WHERE u.email = :email AND u.password = :password")
                .setParameter("email", loginUser.getEmail().trim().toLowerCase())
                .setParameter("password", loginUser.getPassword())
                .getSingleResult();

            // Generate JWT token on successful login
            String token = generateToken(user.getUserId(), user.getEmail(), user.getRole());

            response.put("message", "Login successful");
            response.put("userId", user.getUserId());
            response.put("username", user.getUsername());
            response.put("role", user.getRole());
            response.put("token", token); // Send JWT to frontend
            return ResponseEntity.ok(response);

        } catch (NoResultException e) {
            response.put("error", "Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("error", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Verify token endpoint — frontend can call this to validate session
    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyToken(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            String token = extractToken(authHeader);
            if (token == null) {
                response.put("error", "No token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            Claims claims = validateToken(token);
            response.put("valid", true);
            response.put("userId", claims.get("userId"));
            response.put("email", claims.getSubject());
            response.put("role", claims.get("role"));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Invalid or expired token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    // ─────────────────────────────────────────
    // DRAFT ENDPOINTS (requires USER or ADMIN)
    // ─────────────────────────────────────────

    @PostMapping("/drafts")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> saveDraft(
            @RequestBody Draft draft,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            // JWT Validation
            String token = extractToken(authHeader);
            if (token == null) {
                response.put("error", "Unauthorized: No token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            Claims claims = validateToken(token);
            // Any logged-in user (USER or ADMIN) can save drafts
            draft.setUpdatedAt(LocalDateTime.now());
            if (draft.getStatus() == null) draft.setStatus("draft");

            if (draft.getDraftId() != null) {
                entityManager.merge(draft);
                response.put("status", "Draft updated");
            } else {
                entityManager.persist(draft);
                entityManager.flush();
                response.put("status", "Draft saved");
            }
            response.put("draftId", draft.getDraftId());
            return ResponseEntity.ok(response);

        } catch (io.jsonwebtoken.JwtException e) {
            response.put("error", "Unauthorized: Invalid token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("error", "Failed to save draft: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/drafts")
    public ResponseEntity<List<Draft>> getAllDrafts() {
        List<Draft> drafts = entityManager
            .createQuery("SELECT d FROM Draft d ORDER BY d.updatedAt DESC", Draft.class)
            .getResultList();
        return ResponseEntity.ok(drafts);
    }

    @DeleteMapping("/drafts/{id}")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> deleteDraft(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            String token = extractToken(authHeader);
            if (token == null) {
                response.put("error", "Unauthorized: No token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            Claims claims = validateToken(token);
            String role = (String) claims.get("role");

            Draft draft = entityManager.find(Draft.class, id);
            if (draft == null) {
                response.put("error", "Draft not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // ROLE CHECK: ADMIN can delete any draft, USER can only delete their own
            Long requestingUserId = ((Number) claims.get("userId")).longValue();
            if (!role.equals("ADMIN") && !draft.getAuthorId().equals(requestingUserId)) {
                response.put("error", "Forbidden: You can only delete your own drafts");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            entityManager.remove(draft);
            response.put("status", "Draft deleted");
            return ResponseEntity.ok(response);

        } catch (io.jsonwebtoken.JwtException e) {
            response.put("error", "Unauthorized: Invalid token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("error", "Delete failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ─────────────────────────────────────────
    // CONTENT ENDPOINTS
    // ─────────────────────────────────────────

    @PostMapping("/publish")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> publishContent(
            @RequestBody Content content,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            // JWT Validation — only logged-in users can publish
            String token = extractToken(authHeader);
            if (token == null) {
                response.put("error", "Unauthorized: No token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            Claims claims = validateToken(token);

            content.setPublishedAt(LocalDateTime.now());
            content.setStatus("published");
            entityManager.persist(content);
            entityManager.flush();

            response.put("message", "Content published successfully");
            response.put("contentId", content.getContentId());
            response.put("title", content.getTitle());
            response.put("body", content.getBody());
            response.put("authorId", content.getAuthorId());
            response.put("status", content.getStatus());
            response.put("publishedAt", content.getPublishedAt().toString());
            return ResponseEntity.ok(response);

        } catch (io.jsonwebtoken.JwtException e) {
            response.put("error", "Unauthorized: Invalid token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("error", "Publish failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/content")
    public ResponseEntity<List<Content>> getAllPublishedContent() {
        List<Content> content = entityManager
            .createQuery("SELECT c FROM Content c ORDER BY c.publishedAt DESC", Content.class)
            .getResultList();
        return ResponseEntity.ok(content);
    }

    // ADMIN ONLY — delete any published content
    @DeleteMapping("/content/{id}")
    @jakarta.transaction.Transactional
    public ResponseEntity<Map<String, Object>> deleteContent(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            String token = extractToken(authHeader);
            if (token == null) {
                response.put("error", "Unauthorized: No token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            Claims claims = validateToken(token);
            String role = (String) claims.get("role");

            // ROLE CHECK: Only ADMIN can delete published content
            if (!role.equals("ADMIN")) {
                response.put("error", "Forbidden: Only ADMIN can delete published content");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            Content content = entityManager.find(Content.class, id);
            if (content == null) {
                response.put("error", "Content not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            entityManager.remove(content);
            response.put("status", "Content deleted by ADMIN");
            return ResponseEntity.ok(response);

        } catch (io.jsonwebtoken.JwtException e) {
            response.put("error", "Unauthorized: Invalid token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("error", "Delete failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ADMIN ONLY — get all users
    @GetMapping("/admin/users")
    public ResponseEntity<Object> getAllUsers(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> response = new HashMap<>();
        try {
            String token = extractToken(authHeader);
            if (token == null) {
                response.put("error", "Unauthorized");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            Claims claims = validateToken(token);
            String role = (String) claims.get("role");

            if (!role.equals("ADMIN")) {
                response.put("error", "Forbidden: Admin access required");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            List<User> users = entityManager
                .createQuery("SELECT u FROM User u ORDER BY u.userId ASC", User.class)
                .getResultList();
            return ResponseEntity.ok(users);

        } catch (io.jsonwebtoken.JwtException e) {
            response.put("error", "Unauthorized: Invalid token");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
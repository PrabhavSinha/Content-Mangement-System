package com.cms.sql;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "drafts")
public class Draft {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "draft_id")
    private Long draftId;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String body;

    @Column(name = "author_id")
    private Long authorId;

    private String status;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Long getDraftId() { return draftId; }
    public void setDraftId(Long draftId) { this.draftId = draftId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public Long getAuthorId() { return authorId; }
    public void setAuthorId(Long authorId) { this.authorId = authorId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
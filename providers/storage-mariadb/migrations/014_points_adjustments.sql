CREATE TABLE IF NOT EXISTS points_adjustments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  amount INT NOT NULL,
  reason VARCHAR(255),
  adjustedBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_points_adjustments_userId ON points_adjustments(userId);
CREATE INDEX idx_points_adjustments_createdAt ON points_adjustments(createdAt);

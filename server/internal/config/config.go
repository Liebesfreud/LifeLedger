package config

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"os"
	"time"
)

// Config holds runtime settings pulled from environment variables.
type Config struct {
	Port         string
	JWTSecret    string
	DatabasePath string
	Env          string
}

// Load returns Config with defaults applied.
func Load() Config {
	cfg := Config{
		Port:         getEnv("PORT", "8080"),
		JWTSecret:    getEnv("JWT_SECRET", ""),
		DatabasePath: getEnv("DATABASE_PATH", "./data/subtrack.db"),
		Env:          getEnv("APP_ENV", "development"),
	}

	// Validate JWT secret
	if cfg.JWTSecret == "" {
		if cfg.Env == "production" {
			log.Println("⚠️  WARNING: JWT_SECRET is not set in production! Generating a random secret.")
			log.Println("⚠️  This means all sessions will be invalidated on restart.")
			log.Println("⚠️  Please set JWT_SECRET environment variable for production use.")
		}
		// Generate a random secret for development or as fallback
		cfg.JWTSecret = generateRandomSecret()
	}

	return cfg
}

func (c Config) IsProd() bool {
	return c.Env == "production"
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// generateRandomSecret creates a cryptographically secure random secret.
func generateRandomSecret() string {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		// Fallback to a default (not recommended for production)
		return "insecure-dev-secret-change-me"
	}
	return hex.EncodeToString(bytes)
}

// NowUTC returns ISO string in UTC for consistent timestamps.
func NowUTC() string {
	return time.Now().UTC().Format(time.RFC3339)
}


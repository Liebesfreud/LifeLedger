package main

import (
	"log"
	"os"

	"subtrack/internal/config"
	"subtrack/internal/database"
	"subtrack/internal/domain"
	"subtrack/internal/http"
	"subtrack/internal/http/handlers"
	"subtrack/internal/jobs"

	"github.com/joho/godotenv"
	"gorm.io/gorm/logger"
)

func main() {
	_ = godotenv.Load() // optional for local dev

	cfg := config.Load()

	db, err := database.Open(cfg.DatabasePath, logger.Default)
	if err != nil {
		log.Fatalf("db open: %v", err)
	}

	if err := db.AutoMigrate(&domain.User{}, &domain.Subscription{}, &domain.Category{}, &domain.NotificationLog{}); err != nil {
		log.Fatalf("auto migrate: %v", err)
	}

	h := handlers.New(db, cfg)
	router := http.NewRouter(h, cfg)

	// start background jobs
	_ = jobs.StartScheduler(db, cfg)

	if err := router.Run(":" + cfg.Port); err != nil {
		log.Printf("server stopped: %v", err)
		os.Exit(1)
	}
}

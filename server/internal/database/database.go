package database

import (
	"fmt"
	"os"
	"path/filepath"

	sqlite "github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Open opens SQLite database with sane defaults.
func Open(path string, log logger.Interface) (*gorm.DB, error) {
	// ensure directory exists
	if dir := filepath.Dir(path); dir != "" && dir != "." {
		_ = os.MkdirAll(dir, 0o755)
	}
	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{
		Logger: log,
	})
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}
	return db, nil
}

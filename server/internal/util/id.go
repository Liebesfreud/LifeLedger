package util

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// GenerateID returns a random UUID string with fallback.
func GenerateID() string {
	u, err := uuid.NewRandom()
	if err != nil {
		return fmt.Sprintf("id-%d", time.Now().UnixNano())
	}
	return u.String()
}

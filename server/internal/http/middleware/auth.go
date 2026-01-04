package middleware

import (
	"net/http"
	"strings"

	"subtrack/internal/auth"
	"subtrack/internal/config"

	"github.com/gin-gonic/gin"
)

// Context keys.
const (
	ContextUserID   = "userId"
	ContextUsername = "username"
)

// AuthRequired checks Authorization: Bearer <token>.
func AuthRequired(cfg config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := auth.ParseToken(cfg.JWTSecret, tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextUsername, claims.Username)
		c.Next()
	}
}

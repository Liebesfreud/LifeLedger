package http

import (
	"fmt"
	"time"

	"subtrack/internal/config"
	"subtrack/internal/http/handlers"
	"subtrack/internal/http/middleware"

	"github.com/gin-gonic/gin"
)

// NewRouter wires routes and middleware.
func NewRouter(h *handlers.Handler, cfg config.Config) *gin.Engine {
	r := gin.New()
	r.Use(gin.LoggerWithFormatter(simpleLogFormatter))
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	r.GET("/api/health", h.Health)

	authGroup := r.Group("/api/auth")
	{
		authGroup.POST("/register", h.Register)
		authGroup.POST("/login", h.Login)
		authGroup.GET("/me", middleware.AuthRequired(cfg), h.Me)
	}

	api := r.Group("/api", middleware.AuthRequired(cfg))
	{
		api.GET("/subscriptions", h.ListSubscriptions)
		api.POST("/subscriptions", h.CreateSubscription)
		api.PUT("/subscriptions/:id", h.UpdateSubscription)
		api.DELETE("/subscriptions/:id", h.DeleteSubscription)

		api.GET("/categories", h.ListCategories)
		api.POST("/categories", h.CreateCategory)
		api.PUT("/categories/:id", h.UpdateCategory)
		api.DELETE("/categories/:id", h.DeleteCategory)

		api.GET("/settings", h.GetSettings)
		api.PUT("/settings", h.UpdateSettings)
		api.POST("/settings/refresh-rates", h.RefreshRates)

		api.GET("/notifications/logs", h.ListNotificationLogs)

		api.GET("/data/export", h.ExportData)
		api.POST("/data/import", h.ImportData)
	}

	return r
}

// simpleLogFormatter keeps concise request logs.
func simpleLogFormatter(param gin.LogFormatterParams) string {
	return fmt.Sprintf("%s | %3d | %13v | %15s | %-7s  %s\n",
		param.TimeStamp.Format(time.RFC3339),
		param.StatusCode,
		param.Latency,
		param.ClientIP,
		param.Method,
		param.Path,
	)
}

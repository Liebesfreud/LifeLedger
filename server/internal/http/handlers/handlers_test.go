package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"subtrack/internal/config"
	"subtrack/internal/database"
	"subtrack/internal/domain"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm/logger"
)

func setupTestRouter() (*gin.Engine, *Handler) {
	gin.SetMode(gin.TestMode)

	cfg := config.Config{
		Port:         "8080",
		JWTSecret:    "test-secret",
		DatabasePath: ":memory:",
		Env:          "development",
	}

	db, err := database.Open(cfg.DatabasePath, logger.Default)
	if err != nil {
		panic(err)
	}

	// Run migrations
	db.AutoMigrate(&domain.User{}, &domain.Subscription{}, &domain.Category{}, &domain.NotificationLog{})

	h := New(db, cfg)

	router := gin.New()
	router.POST("/api/auth/register", h.Register)
	router.POST("/api/auth/login", h.Login)
	router.GET("/api/health", h.Health)

	return router, h
}

func TestHealth(t *testing.T) {
	router, _ := setupTestRouter()

	req, _ := http.NewRequest("GET", "/api/health", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}
}

func TestRegister(t *testing.T) {
	router, _ := setupTestRouter()

	// Test successful registration
	body := map[string]string{
		"username": "testuser",
		"password": "testpassword123",
	}
	jsonBody, _ := json.Marshal(body)

	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusCreated {
		t.Errorf("Expected status 201, got %d. Body: %s", w.Code, w.Body.String())
	}

	// Test duplicate registration
	req2, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req2.Header.Set("Content-Type", "application/json")
	w2 := httptest.NewRecorder()
	router.ServeHTTP(w2, req2)

	if w2.Code != http.StatusConflict {
		t.Errorf("Expected status 409 for duplicate user, got %d", w2.Code)
	}
}

func TestLogin(t *testing.T) {
	router, _ := setupTestRouter()

	// First register a user
	regBody := map[string]string{
		"username": "logintest",
		"password": "password123",
	}
	jsonBody, _ := json.Marshal(regBody)
	req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	// Test successful login
	loginReq, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(jsonBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginW := httptest.NewRecorder()
	router.ServeHTTP(loginW, loginReq)

	if loginW.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d. Body: %s", loginW.Code, loginW.Body.String())
	}

	// Verify token is returned
	var response map[string]interface{}
	json.Unmarshal(loginW.Body.Bytes(), &response)
	if _, ok := response["token"]; !ok {
		t.Error("Expected token in response")
	}

	// Test wrong password
	wrongBody := map[string]string{
		"username": "logintest",
		"password": "wrongpassword",
	}
	wrongJson, _ := json.Marshal(wrongBody)
	wrongReq, _ := http.NewRequest("POST", "/api/auth/login", bytes.NewBuffer(wrongJson))
	wrongReq.Header.Set("Content-Type", "application/json")
	wrongW := httptest.NewRecorder()
	router.ServeHTTP(wrongW, wrongReq)

	if wrongW.Code != http.StatusUnauthorized {
		t.Errorf("Expected status 401 for wrong password, got %d", wrongW.Code)
	}
}

func TestRegisterValidation(t *testing.T) {
	router, _ := setupTestRouter()

	tests := []struct {
		name       string
		body       map[string]string
		wantStatus int
	}{
		{
			name:       "Empty username",
			body:       map[string]string{"username": "", "password": "password123"},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "Empty password",
			body:       map[string]string{"username": "testuser", "password": ""},
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "Short password",
			body:       map[string]string{"username": "testuser", "password": "12345"},
			wantStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			jsonBody, _ := json.Marshal(tt.body)
			req, _ := http.NewRequest("POST", "/api/auth/register", bytes.NewBuffer(jsonBody))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			if w.Code != tt.wantStatus {
				t.Errorf("Expected status %d, got %d. Body: %s", tt.wantStatus, w.Code, w.Body.String())
			}
		})
	}
}

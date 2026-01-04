package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"subtrack/internal/auth"
	"subtrack/internal/config"
	"subtrack/internal/constants"
	"subtrack/internal/domain"
	"subtrack/internal/http/middleware"
	"subtrack/internal/types"
	"subtrack/internal/util"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type Handler struct {
	DB  *gorm.DB
	Cfg config.Config
}

func New(db *gorm.DB, cfg config.Config) *Handler {
	return &Handler{DB: db, Cfg: cfg}
}

func (h *Handler) Health(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// POST /api/auth/register
func (h *Handler) Register(c *gin.Context) {
	var req types.AuthRegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}

	var existing domain.User
	if err := h.DB.Where("username = ?", req.Username).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, types.ErrorResponse{Error: "username exists"})
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "hash error"})
		return
	}

	user := domain.User{
		Username:     req.Username,
		PasswordHash: hash,
		Settings: domain.UserSettings{
			BaseCurrency:      "CNY",
			ThemeColor:        "#3b82f6",
			DarkMode:          false,
			Language:          "zh",
			NotificationStyle: "simple",
			DefaultNotifyDays: 3,
			CurrencyRates:     map[string]float64{"CNY": 1},
			RatesUpdatedAt:    config.NowUTC(),
		},
		CreatedAt: time.Now().UTC(),
	}
	if err := h.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "create user failed"})
		return
	}

	token, err := auth.CreateToken(h.Cfg.JWTSecret, user.ID, user.Username, 7*24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "token error"})
		return
	}

	c.JSON(http.StatusCreated, types.AuthResponse{
		Token:    token,
		Username: user.Username,
		UserID:   user.ID,
	})
}

// POST /api/auth/login
func (h *Handler) Login(c *gin.Context) {
	var req types.AuthLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}

	var user domain.User
	if err := h.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "invalid credentials"})
		return
	}

	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "invalid credentials"})
		return
	}

	token, err := auth.CreateToken(h.Cfg.JWTSecret, user.ID, user.Username, 7*24*time.Hour)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "token error"})
		return
	}

	c.JSON(http.StatusOK, types.AuthResponse{
		Token:    token,
		Username: user.Username,
		UserID:   user.ID,
	})
}

// GET /api/auth/me
func (h *Handler) Me(c *gin.Context) {
	userIDVal, ok := c.Get(middleware.ContextUserID)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var user domain.User
	if err := h.DB.First(&user, userIDVal).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"userId":   user.ID,
		"username": user.Username,
		"settings": user.Settings,
	})
}

// GET /api/subscriptions
func (h *Handler) ListSubscriptions(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var subs []domain.Subscription
	if err := h.DB.Where("user_id = ?", userID).Find(&subs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "query failed"})
		return
	}
	c.JSON(http.StatusOK, subs)
}

// POST /api/subscriptions
func (h *Handler) CreateSubscription(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}

	var req types.SubscriptionCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}
	if !constants.IsValidCurrency(req.Currency) || !constants.IsValidBillingCycle(req.BillingCycle) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid currency or billingCycle"})
		return
	}
	if _, err := time.Parse(time.RFC3339, req.NextPaymentDate); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "nextPaymentDate must be RFC3339"})
		return
	}

	sub := domain.Subscription{
		ID:               util.GenerateID(),
		UserID:           userID,
		Name:             req.Name,
		Price:            req.Price,
		Currency:         req.Currency,
		BillingCycle:     req.BillingCycle,
		NextPaymentDate:  req.NextPaymentDate,
		CategoryID:       req.CategoryID,
		Icon:             req.Icon,
		Description:      req.Description,
		NotifyDaysBefore: req.NotifyDaysBefore,
		AutoRenew:        req.AutoRenew,
		Tags:             req.Tags,
		CreatedAt:        time.Now().UTC(),
	}

	if err := h.DB.Create(&sub).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "create failed"})
		return
	}
	c.JSON(http.StatusCreated, sub)
}

// PUT /api/subscriptions/:id
func (h *Handler) UpdateSubscription(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}

	var req types.SubscriptionUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}
	if req.ID == "" {
		if pid := c.Param("id"); pid != "" {
			req.ID = pid
		}
	}
	if req.ID == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "id required"})
		return
	}
	if req.Currency != "" && !constants.IsValidCurrency(req.Currency) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid currency"})
		return
	}
	if req.BillingCycle != "" && !constants.IsValidBillingCycle(req.BillingCycle) {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid billingCycle"})
		return
	}
	if req.NextPaymentDate != "" {
		if _, err := time.Parse(time.RFC3339, req.NextPaymentDate); err != nil {
			c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "nextPaymentDate must be RFC3339"})
			return
		}
	}

	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Price != 0 {
		updates["price"] = req.Price
	}
	if req.Currency != "" {
		updates["currency"] = req.Currency
	}
	if req.BillingCycle != "" {
		updates["billing_cycle"] = req.BillingCycle
	}
	if req.NextPaymentDate != "" {
		updates["next_payment_date"] = req.NextPaymentDate
	}
	if req.CategoryID != "" {
		updates["category_id"] = req.CategoryID
	}
	if req.Icon != "" {
		updates["icon"] = req.Icon
	}
	updates["description"] = req.Description
	if req.Tags != "" {
		updates["tags"] = req.Tags
	}
	if req.NotifyDaysBefore != 0 {
		updates["notify_days_before"] = req.NotifyDaysBefore
	}
	if req.AutoRenew != nil {
		updates["auto_renew"] = *req.AutoRenew
	}

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "no fields to update"})
		return
	}

	res := h.DB.Model(&domain.Subscription{}).
		Where("id = ? AND user_id = ?", req.ID, userID).
		Updates(updates)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "update failed"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DELETE /api/subscriptions/:id
func (h *Handler) DeleteSubscription(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "id required"})
		return
	}

	res := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&domain.Subscription{})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "delete failed"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GET /api/categories
func (h *Handler) ListCategories(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var cats []domain.Category
	if err := h.DB.Where("user_id = ?", userID).Find(&cats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "query failed"})
		return
	}
	c.JSON(http.StatusOK, cats)
}

// POST /api/categories
func (h *Handler) CreateCategory(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var req types.CategoryCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}

	cat := domain.Category{
		ID:        util.GenerateID(),
		UserID:    userID,
		Name:      req.Name,
		Color:     req.Color,
		CreatedAt: time.Now().UTC(),
	}
	if err := h.DB.Create(&cat).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "create failed"})
		return
	}
	c.JSON(http.StatusCreated, cat)
}

// PUT /api/categories/:id
func (h *Handler) UpdateCategory(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var req types.CategoryUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}
	if req.ID == "" {
		if pid := c.Param("id"); pid != "" {
			req.ID = pid
		}
	}
	if req.ID == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "id required"})
		return
	}
	updates := map[string]interface{}{}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Color != "" {
		updates["color"] = req.Color
	}
	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "no fields to update"})
		return
	}

	res := h.DB.Model(&domain.Category{}).
		Where("id = ? AND user_id = ?", req.ID, userID).
		Updates(updates)
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "update failed"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// DELETE /api/categories/:id
func (h *Handler) DeleteCategory(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "id required"})
		return
	}
	res := h.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&domain.Category{})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "delete failed"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

// GET /api/settings
func (h *Handler) GetSettings(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var user domain.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "user not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"username": user.Username,
		"settings": user.Settings,
	})
}

// PUT /api/settings
func (h *Handler) UpdateSettings(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var req types.SettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}

	var user domain.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "user not found"})
		return
	}

	// handle password change
	if req.CurrentPassword != "" && req.NewPassword != "" {
		if !auth.CheckPassword(req.CurrentPassword, user.PasswordHash) {
			c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "当前密码错误"})
			return
		}
		newHash, err := auth.HashPassword(req.NewPassword)
		if err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "hash error"})
			return
		}
		if err := h.DB.Model(&user).Update("password_hash", newHash).Error; err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "update failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "密码已更新"})
		return
	}

	// handle username change
	if req.NewUsername != "" {
		var exists domain.User
		if err := h.DB.Where("username = ?", req.NewUsername).First(&exists).Error; err == nil && exists.ID != userID {
			c.JSON(http.StatusConflict, types.ErrorResponse{Error: "用户名已存在"})
			return
		}
		if err := h.DB.Model(&user).Update("username", req.NewUsername).Error; err != nil {
			c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "update failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "用户名已更新"})
		return
	}

	// general settings
	current := user.Settings
	if req.ThemeColor != nil {
		current.ThemeColor = *req.ThemeColor
	}
	if req.DarkMode != nil {
		current.DarkMode = *req.DarkMode
	}
	if req.Language != nil {
		current.Language = *req.Language
	}
	if req.TelegramBotToken != nil {
		current.TelegramBotToken = *req.TelegramBotToken
	}
	if req.TelegramChatID != nil {
		current.TelegramChatID = *req.TelegramChatID
	}
	if req.NotificationStyle != nil {
		current.NotificationStyle = *req.NotificationStyle
	}
	if req.DefaultNotifyDays != nil {
		current.DefaultNotifyDays = *req.DefaultNotifyDays
	}
	if req.CurrencyRates != nil {
		current.CurrencyRates = req.CurrencyRates
		if current.BaseCurrency != "" {
			current.CurrencyRates[current.BaseCurrency] = 1
		}
	}
	if req.BaseCurrency != nil {
		newBase := strings.ToUpper(*req.BaseCurrency)
		if newBase != current.BaseCurrency {
			// Base currency changed, fetch fresh rates
			rates, updatedAt, err := fetchRates(newBase)
			if err != nil {
				// Keep current base but log/warn? Or fail? 
				// For now let's just log and continue, but better to fail?
				// The plan said "fail or fallback". Let's log and maybe fail update?
				// Actually, simpler to fail the request if we can't get rates for the new base.
				c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "failed to fetch rates for new base currency"})
				return
			}
			current.BaseCurrency = newBase
			current.CurrencyRates = rates
			current.RatesUpdatedAt = updatedAt
		} else {
			// Same base, just ensure it's set
			current.BaseCurrency = newBase
			if current.CurrencyRates == nil {
				current.CurrencyRates = map[string]float64{}
			}
			current.CurrencyRates[current.BaseCurrency] = 1
		}
	}
	if req.RatesUpdatedAt != nil {
		current.RatesUpdatedAt = *req.RatesUpdatedAt
	}
	if req.MonthlyBudget != nil {
		current.MonthlyBudget = *req.MonthlyBudget
	}
	if req.EmailSettings != nil {
		if req.EmailSettings.Enabled != nil {
			current.EmailSettings.Enabled = *req.EmailSettings.Enabled
		}
		if req.EmailSettings.SMTPServer != nil {
			current.EmailSettings.SMTPServer = *req.EmailSettings.SMTPServer
		}
		if req.EmailSettings.SMTPPort != nil {
			current.EmailSettings.SMTPPort = *req.EmailSettings.SMTPPort
		}
		if req.EmailSettings.SMTPUser != nil {
			current.EmailSettings.SMTPUser = *req.EmailSettings.SMTPUser
		}
		if req.EmailSettings.SMTPPassword != nil {
			current.EmailSettings.SMTPPassword = *req.EmailSettings.SMTPPassword
		}
		if req.EmailSettings.FromEmail != nil {
			current.EmailSettings.FromEmail = *req.EmailSettings.FromEmail
		}
	}

	if err := saveSettings(h.DB, user.ID, current); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "update failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "settings": current})
}

// GET /api/notifications/logs
func (h *Handler) ListNotificationLogs(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}
	var logs []domain.NotificationLog
	if err := h.DB.Where("user_id = ?", userID).Order("sent_at desc").Find(&logs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "query failed"})
		return
	}
	c.JSON(http.StatusOK, logs)
}

// GET /api/data/export
func (h *Handler) ExportData(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}

	var user domain.User
	var subs []domain.Subscription
	var cats []domain.Category
	var logs []domain.NotificationLog

	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "user not found"})
		return
	}
	_ = h.DB.Where("user_id = ?", userID).Find(&subs).Error
	_ = h.DB.Where("user_id = ?", userID).Find(&cats).Error
	_ = h.DB.Where("user_id = ?", userID).Find(&logs).Error

	export := types.ExportData{
		Version:    "2.0",
		ExportedAt: time.Now().UTC().Format(time.RFC3339),
		Settings: map[string]interface{}{
			"themeColor":        user.Settings.ThemeColor,
			"darkMode":          user.Settings.DarkMode,
			"language":          user.Settings.Language,
			"telegramBotToken":  user.Settings.TelegramBotToken,
			"telegramChatId":    user.Settings.TelegramChatID,
			"notificationStyle": user.Settings.NotificationStyle,
			"defaultNotifyDays": user.Settings.DefaultNotifyDays,
			"currencyRates":     user.Settings.CurrencyRates,
			"baseCurrency":      user.Settings.BaseCurrency,
			"ratesUpdatedAt":    user.Settings.RatesUpdatedAt,
		},
	}

	for _, s := range subs {
		export.Subscriptions = append(export.Subscriptions, map[string]interface{}{
			"id":               s.ID,
			"name":             s.Name,
			"price":            s.Price,
			"currency":         s.Currency,
			"billingCycle":     s.BillingCycle,
			"nextPaymentDate":  s.NextPaymentDate,
			"categoryId":       s.CategoryID,
			"icon":             s.Icon,
			"description":      s.Description,
			"notifyDaysBefore": s.NotifyDaysBefore,
			"autoRenew":        s.AutoRenew,
			"createdAt":        s.CreatedAt,
		})
	}

	for _, ccat := range cats {
		export.Categories = append(export.Categories, map[string]interface{}{
			"id":        ccat.ID,
			"name":      ccat.Name,
			"color":     ccat.Color,
			"createdAt": ccat.CreatedAt,
		})
	}

	for _, l := range logs {
		export.NotificationLogs = append(export.NotificationLogs, map[string]interface{}{
			"id":               l.ID,
			"subscriptionId":   l.SubscriptionID,
			"subscriptionName": l.SubscriptionName,
			"sentAt":           l.SentAt,
			"status":           l.Status,
		})
	}

	c.JSON(http.StatusOK, export)
}

// POST /api/data/import
func (h *Handler) ImportData(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}

	var payload types.ImportData
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, types.ErrorResponse{Error: "invalid payload"})
		return
	}

	var user domain.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "user not found"})
		return
	}

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// clear existing
		if err := tx.Where("user_id = ?", userID).Delete(&domain.Subscription{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&domain.Category{}).Error; err != nil {
			return err
		}
		if err := tx.Where("user_id = ?", userID).Delete(&domain.NotificationLog{}).Error; err != nil {
			return err
		}

		// import categories
		for _, cat := range payload.Categories {
			id, _ := cat["id"].(string)
			name, _ := cat["name"].(string)
			color, _ := cat["color"].(string)
			createdAt := time.Now().UTC()
			if t, ok := cat["createdAt"].(string); ok {
				if parsed, err := time.Parse(time.RFC3339, t); err == nil {
					createdAt = parsed
				}
			}
			if id == "" {
				id = util.GenerateID()
			}
			if err := tx.Create(&domain.Category{
				ID:        id,
				UserID:    userID,
				Name:      name,
				Color:     color,
				CreatedAt: createdAt,
			}).Error; err != nil {
				return err
			}
		}

		// import subscriptions
		for _, sub := range payload.Subscriptions {
			id, _ := sub["id"].(string)
			name, _ := sub["name"].(string)
			price, _ := sub["price"].(float64)
			currency, _ := sub["currency"].(string)
			billingCycle, _ := sub["billingCycle"].(string)
			nextPaymentDate, _ := sub["nextPaymentDate"].(string)
			categoryID, _ := sub["categoryId"].(string)
			icon, _ := sub["icon"].(string)
			description, _ := sub["description"].(string)
			notify, _ := sub["notifyDaysBefore"].(float64)
			autoRenew, _ := sub["autoRenew"].(bool)
			createdAt := time.Now().UTC()
			if t, ok := sub["createdAt"].(string); ok {
				if parsed, err := time.Parse(time.RFC3339, t); err == nil {
					createdAt = parsed
				}
			}
			if id == "" {
				id = util.GenerateID()
			}
			if err := tx.Create(&domain.Subscription{
				ID:               id,
				UserID:           userID,
				Name:             name,
				Price:            price,
				Currency:         currency,
				BillingCycle:     billingCycle,
				NextPaymentDate:  nextPaymentDate,
				CategoryID:       categoryID,
				Icon:             icon,
				Description:      description,
				NotifyDaysBefore: int(notify),
				AutoRenew:        autoRenew,
				CreatedAt:        createdAt,
			}).Error; err != nil {
				return err
			}
		}

		// import logs
		for _, logItem := range payload.NotificationLogs {
			id, _ := logItem["id"].(string)
			subID, _ := logItem["subscriptionId"].(string)
			subName, _ := logItem["subscriptionName"].(string)
			status, _ := logItem["status"].(string)
			sentAt := time.Now().UTC()
			if t, ok := logItem["sentAt"].(string); ok {
				if parsed, err := time.Parse(time.RFC3339, t); err == nil {
					sentAt = parsed
				}
			}
			if id == "" {
				id = util.GenerateID()
			}
			if err := tx.Create(&domain.NotificationLog{
				ID:               id,
				UserID:           userID,
				SubscriptionID:   subID,
				SubscriptionName: subName,
				SentAt:           sentAt,
				Status:           status,
			}).Error; err != nil {
				return err
			}
		}

		// settings
		if payload.Settings != nil {
			settings := user.Settings
			if v, ok := payload.Settings["themeColor"].(string); ok {
				settings.ThemeColor = v
			}
			if v, ok := payload.Settings["darkMode"].(bool); ok {
				settings.DarkMode = v
			}
			if v, ok := payload.Settings["language"].(string); ok {
				settings.Language = v
			}
			if v, ok := payload.Settings["telegramBotToken"].(string); ok {
				settings.TelegramBotToken = v
			}
			if v, ok := payload.Settings["telegramChatId"].(string); ok {
				settings.TelegramChatID = v
			}
			if v, ok := payload.Settings["notificationStyle"].(string); ok {
				settings.NotificationStyle = v
			}
			if v, ok := payload.Settings["defaultNotifyDays"].(float64); ok {
				settings.DefaultNotifyDays = int(v)
			}
			if v, ok := payload.Settings["currencyRates"].(map[string]interface{}); ok {
				rates := map[string]float64{}
				for key, val := range v {
					if f, ok := val.(float64); ok {
						rates[key] = f
					}
				}
				settings.CurrencyRates = rates
			}
			if v, ok := payload.Settings["baseCurrency"].(string); ok && v != "" {
				settings.BaseCurrency = v
				if settings.CurrencyRates == nil {
					settings.CurrencyRates = map[string]float64{}
				}
				settings.CurrencyRates[v] = 1
			}
			if v, ok := payload.Settings["ratesUpdatedAt"].(string); ok {
				settings.RatesUpdatedAt = v
			}
			if err := saveSettings(tx, userID, settings); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "import failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true, "message": "数据导入成功"})
}

// POST /api/settings/refresh-rates
func (h *Handler) RefreshRates(c *gin.Context) {
	userID, ok := getUserID(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, types.ErrorResponse{Error: "unauthorized"})
		return
	}

	var payload struct {
		BaseCurrency string `json:"baseCurrency"`
	}
	_ = c.ShouldBindJSON(&payload)
	base := strings.ToUpper(strings.TrimSpace(payload.BaseCurrency))
	if base == "" {
		base = "CNY"
	}

	var user domain.User
	if err := h.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, types.ErrorResponse{Error: "user not found"})
		return
	}
	if user.Settings.BaseCurrency != "" && payload.BaseCurrency == "" {
		base = strings.ToUpper(user.Settings.BaseCurrency)
	}

	rates, updatedAt, err := fetchRates(base)
	if err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "rate fetch failed"})
		return
	}

	// Filter rates: only keep currencies user actually uses + Base
	usedCurrencies := make(map[string]bool)
	usedCurrencies[base] = true
	var subs []domain.Subscription
	if err := h.DB.Where("user_id = ?", user.ID).Find(&subs).Error; err == nil {
		for _, s := range subs {
			if s.Currency != "" {
				usedCurrencies[strings.ToUpper(s.Currency)] = true
			}
		}
	}

	filteredRates := make(map[string]float64)
	for cur, rate := range rates {
		if usedCurrencies[cur] {
			filteredRates[cur] = rate
		}
	}

	settings := user.Settings
	if settings.CurrencyRates == nil {
		settings.CurrencyRates = map[string]float64{}
	}
	settings.BaseCurrency = base
	settings.CurrencyRates = filteredRates
	settings.RatesUpdatedAt = updatedAt

	if err := saveSettings(h.DB, user.ID, settings); err != nil {
		c.JSON(http.StatusInternalServerError, types.ErrorResponse{Error: "update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"settings": settings})
}

// helper: get user id from context
func getUserID(c *gin.Context) (uint, bool) {
	v, ok := c.Get(middleware.ContextUserID)
	if !ok {
		return 0, false
	}
	switch val := v.(type) {
	case uint:
		return val, true
	case int:
		return uint(val), true
	case int64:
		return uint(val), true
	default:
		return 0, false
	}
}

// fetchRates retrieves latest rates for the given base currency using a public API.
func fetchRates(base string) (map[string]float64, string, error) {
	type rateAPIResponse struct {
		Result            string             `json:"result"`
		Rates             map[string]float64 `json:"rates"`
		TimeLastUpdateUTC string             `json:"time_last_update_utc"`
	}

	apiURL := "https://open.er-api.com/v6/latest/" + strings.ToUpper(base)
	req, err := http.NewRequest(http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, "", err
	}
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer resp.Body.Close()

	var parsed rateAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, "", err
	}
	if parsed.Rates == nil || len(parsed.Rates) == 0 {
		return nil, "", fmt.Errorf("empty rates")
	}
	parsed.Rates[strings.ToUpper(base)] = 1
	return parsed.Rates, parsed.TimeLastUpdateUTC, nil
}

// saveSettings marshals settings to JSON string to ensure SQLite accepts it.
func saveSettings(db *gorm.DB, userID uint, settings domain.UserSettings) error {
	bytes, err := json.Marshal(settings)
	if err != nil {
		return err
	}
	return db.Exec("UPDATE users SET settings = ? WHERE id = ?", string(bytes), userID).Error
}

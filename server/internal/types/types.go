package types

// Standard API responses and requests used by handlers.

type AuthRegisterRequest struct {
	Username string `json:"username" binding:"required,min=2,max=20"`
	Password string `json:"password" binding:"required,min=6"`
}

type AuthLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type SubscriptionCreateRequest struct {
	Name             string  `json:"name" binding:"required"`
	Price            float64 `json:"price" binding:"required"`
	Currency         string  `json:"currency" binding:"required"`
	BillingCycle     string  `json:"billingCycle" binding:"required"`
	NextPaymentDate  string  `json:"nextPaymentDate" binding:"required"`
	CategoryID       string  `json:"categoryId" binding:"required"`
	Icon             string  `json:"icon" binding:"required"`
	Description      string  `json:"description"`
	NotifyDaysBefore int     `json:"notifyDaysBefore" binding:"required"`
	AutoRenew        bool    `json:"autoRenew"`
	Tags             string  `json:"tags"`
}

type SubscriptionUpdateRequest struct {
	ID string `json:"id" binding:"required"`

	Name             string  `json:"name"`
	Price            float64 `json:"price"`
	Currency         string  `json:"currency"`
	BillingCycle     string  `json:"billingCycle"`
	NextPaymentDate  string  `json:"nextPaymentDate"`
	CategoryID       string  `json:"categoryId"`
	Icon             string  `json:"icon"`
	Description      string  `json:"description"`
	NotifyDaysBefore int     `json:"notifyDaysBefore"`
	AutoRenew        *bool   `json:"autoRenew"`
	Tags             string  `json:"tags"`
}

type CategoryCreateRequest struct {
	Name  string `json:"name" binding:"required"`
	Color string `json:"color" binding:"required"`
}

type CategoryUpdateRequest struct {
	ID    string `json:"id" binding:"required"`
	Name  string `json:"name"`
	Color string `json:"color"`
}

type AuthResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	UserID   uint   `json:"userId"`
}

type EmailSettingsRequest struct {
	Enabled      *bool   `json:"enabled"`
	SMTPServer   *string `json:"smtpServer"`
	SMTPPort     *int    `json:"smtpPort"`
	SMTPUser     *string `json:"smtpUser"`
	SMTPPassword *string `json:"smtpPassword"`
	FromEmail    *string `json:"fromEmail"`
}

type SettingsRequest struct {
	ThemeColor        *string               `json:"themeColor"`
	DarkMode          *bool                 `json:"darkMode"`
	Language          *string               `json:"language"`
	TelegramBotToken  *string               `json:"telegramBotToken"`
	TelegramChatID    *string               `json:"telegramChatId"`
	NotificationStyle *string               `json:"notificationStyle"`
	DefaultNotifyDays *int                  `json:"defaultNotifyDays"`
	CurrencyRates     map[string]float64    `json:"currencyRates"`
	BaseCurrency      *string               `json:"baseCurrency"`
	RatesUpdatedAt    *string               `json:"ratesUpdatedAt"`
	MonthlyBudget     *float64              `json:"monthlyBudget"`
	EmailSettings     *EmailSettingsRequest `json:"emailSettings"`
	CurrentPassword   string                `json:"currentPassword"`
	NewPassword       string                `json:"newPassword"`
	NewUsername       string                `json:"newUsername"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type ExportData struct {
	Version          string                   `json:"version"`
	ExportedAt       string                   `json:"exportedAt"`
	Settings         map[string]interface{}   `json:"settings"`
	Subscriptions    []map[string]interface{} `json:"subscriptions"`
	Categories       []map[string]interface{} `json:"categories"`
	NotificationLogs []map[string]interface{} `json:"notificationLogs"`
}

type ImportData struct {
	Settings         map[string]interface{}   `json:"settings"`
	Subscriptions    []map[string]interface{} `json:"subscriptions"`
	Categories       []map[string]interface{} `json:"categories"`
	NotificationLogs []map[string]interface{} `json:"notificationLogs"`
}

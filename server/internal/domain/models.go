package domain

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// User settings stored as JSON in DB.
type UserSettings struct {
	ThemeColor        string             `json:"themeColor"`
	DarkMode          bool               `json:"darkMode"`
	Language          string             `json:"language"`
	TelegramBotToken  string             `json:"telegramBotToken,omitempty"`
	TelegramChatID    string             `json:"telegramChatId,omitempty"`
	NotificationStyle string             `json:"notificationStyle"`
	DefaultNotifyDays int                `json:"defaultNotifyDays"`
	CurrencyRates     map[string]float64 `json:"currencyRates"`
	BaseCurrency      string             `json:"baseCurrency"`
	RatesUpdatedAt    string             `json:"ratesUpdatedAt,omitempty"`
	MonthlyBudget     float64            `json:"monthlyBudget,omitempty"`
	EmailSettings     EmailSettings      `json:"emailSettings,omitempty"`
}

type EmailSettings struct {
	Enabled      bool   `json:"enabled"`
	SMTPServer   string `json:"smtpServer"`
	SMTPPort     int    `json:"smtpPort"`
	SMTPUser     string `json:"smtpUser"`
	SMTPPassword string `json:"smtpPassword"`
	FromEmail    string `json:"fromEmail"`
}

// Value implements driver.Valuer for JSON storage.
func (s UserSettings) Value() (driver.Value, error) {
	return json.Marshal(s)
}

// Scan implements sql.Scanner for JSON storage.
func (s *UserSettings) Scan(value interface{}) error {
	if value == nil {
		*s = UserSettings{}
		return nil
	}
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, s)
	case string:
		return json.Unmarshal([]byte(v), s)
	default:
		return json.Unmarshal([]byte{}, s)
	}
}

type User struct {
	ID           uint         `gorm:"primaryKey" json:"id"`
	Username     string       `gorm:"uniqueIndex;size:64" json:"username"`
	PasswordHash string       `json:"-"`
	Settings     UserSettings `gorm:"type:json;serializer:json" json:"settings"`
	CreatedAt    time.Time    `json:"createdAt"`
}

type Subscription struct {
	ID               string    `gorm:"primaryKey;size:64" json:"id"`
	UserID           uint      `gorm:"index" json:"userId"`
	Name             string    `gorm:"size:128" json:"name"`
	Price            float64   `json:"price"`
	Currency         string    `gorm:"size:8" json:"currency"`
	BillingCycle     string    `gorm:"size:16" json:"billingCycle"`
	NextPaymentDate  string    `json:"nextPaymentDate"`
	CategoryID       string    `gorm:"size:64" json:"categoryId"`
	Icon             string    `gorm:"size:128" json:"icon"`
	Description      string    `gorm:"type:text" json:"description"`
	NotifyDaysBefore int       `json:"notifyDaysBefore"`
	AutoRenew        bool      `json:"autoRenew"`
	Tags             string    `gorm:"size:256" json:"tags"` // Comma separated tags
	CreatedAt        time.Time `json:"createdAt"`
}

type Category struct {
	ID        string    `gorm:"primaryKey;size:64" json:"id"`
	UserID    uint      `gorm:"index" json:"userId"`
	Name      string    `gorm:"size:64" json:"name"`
	Color     string    `gorm:"size:32" json:"color"`
	CreatedAt time.Time `json:"createdAt"`
}

type NotificationLog struct {
	ID               string    `gorm:"primaryKey;size:64" json:"id"`
	UserID           uint      `gorm:"index" json:"userId"`
	SubscriptionID   string    `gorm:"size:64" json:"subscriptionId"`
	SubscriptionName string    `gorm:"size:128" json:"subscriptionName"`
	SentAt           time.Time `json:"sentAt"`
	Status           string    `gorm:"size:16" json:"status"`
	Channel          string    `gorm:"size:16" json:"channel"` // telegram or email
}

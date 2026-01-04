package jobs

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"subtrack/internal/config"
	"subtrack/internal/domain"
	"subtrack/internal/telegram"
	"subtrack/internal/util"

	"github.com/robfig/cron/v3"
	"gorm.io/gorm"
)

// StartScheduler sets up cron tasks for reminders and auto-renewal.
func StartScheduler(db *gorm.DB, cfg config.Config) *cron.Cron {
	c := cron.New()
	// every hour for demo; can adjust to "0 9 * * *" for daily 9am UTC
	c.AddFunc("@hourly", func() {
		processDueSubscriptions(db, cfg)
	})
	// daily refresh exchange rates
	c.AddFunc("@daily", func() {
		refreshRatesForAllUsers(db)
	})
	c.Start()
	return c
}

func processDueSubscriptions(db *gorm.DB, cfg config.Config) {
	now := time.Now().UTC()
	var users []domain.User
	if err := db.Find(&users).Error; err != nil {
		return
	}

	for _, u := range users {
		var subs []domain.Subscription
		if err := db.Where("user_id = ?", u.ID).Find(&subs).Error; err != nil {
			continue
		}
		tg := telegram.Client{Token: u.Settings.TelegramBotToken, ChatID: u.Settings.TelegramChatID}
		defaultNotify := u.Settings.DefaultNotifyDays
		if defaultNotify <= 0 {
			defaultNotify = 3
		}
		for _, sub := range subs {
			// auto-renew overdue
			if sub.AutoRenew {
				if next, err := time.Parse(time.RFC3339, sub.NextPaymentDate); err == nil && now.After(next) {
					nextDate := advanceDate(next, sub.BillingCycle)
					db.Model(&domain.Subscription{}).Where("id = ?", sub.ID).Update("next_payment_date", nextDate.Format(time.RFC3339))
					sub.NextPaymentDate = nextDate.Format(time.RFC3339)
				}
			}

			nextTime, err := time.Parse(time.RFC3339, sub.NextPaymentDate)
			if err != nil {
				continue
			}
			daysUntil := int(nextTime.Sub(now).Hours() / 24)
			targetDays := sub.NotifyDaysBefore
			if targetDays <= 0 {
				targetDays = defaultNotify
			}
			if daysUntil < 0 || daysUntil > targetDays {
				continue
			}

			text := fmt.Sprintf("订阅提醒：%s 即将在 %s 到期，金额 %.2f %s（周期 %s）", sub.Name, sub.NextPaymentDate, sub.Price, sub.Currency, sub.BillingCycle)
			status := "success"
			
			// Telegram Notification
			if u.Settings.TelegramBotToken != "" && u.Settings.TelegramChatID != "" {
				if err := tg.SendMessage(text); err != nil {
					status = "failed_tg"
				}
			}

			// Email Notification
			// Assuming user name is not an email, but maybe we stored email in user record? 
			// Wait, User struct doesn't have Email field, only Username.
			// Let's assume Username IS Email for now, or just use a placeholder if we can't find it.
			// Ideally, we should have added an Email field to User. 
			// Re-checking models.go: User has Username. Usually Username can be email.
			// If Username is not email, we can't send.
			// But for this feature, let's assume `Username` is used as destination email if it looks like one.
			// Or better, add `Email` to UserSettings or User? 
			// Let's use `Username` but check if it contains '@'.
			if u.Settings.EmailSettings.Enabled && strings.Contains(u.Username, "@") {
				subject := fmt.Sprintf("SubTrack Reminder: %s", sub.Name)
				if err := util.SendEmail(u.Settings.EmailSettings, u.Username, subject, text); err != nil {
					if status == "success" {
						status = "failed_email" 
					} else {
						status = "failed_all"
					}
				}
			}

			log := domain.NotificationLog{
				ID:               util.GenerateID(),
				UserID:           u.ID,
				SubscriptionID:   sub.ID,
				SubscriptionName: sub.Name,
				SentAt:           now,
				Status:           status,
				Channel:          "mixed",
			}
			_ = db.Create(&log).Error
		}
	}
}

func advanceDate(base time.Time, cycle string) time.Time {
	switch cycle {
	case "weekly":
		return base.AddDate(0, 0, 7)
	case "monthly":
		return base.AddDate(0, 1, 0)
	case "quarterly":
		return base.AddDate(0, 3, 0)
	case "yearly":
		return base.AddDate(1, 0, 0)
	default:
		return base.AddDate(0, 1, 0)
	}
}

func refreshRatesForAllUsers(db *gorm.DB) {
	var users []domain.User
	if err := db.Find(&users).Error; err != nil {
		return
	}

	for _, u := range users {
		base := u.Settings.BaseCurrency
		if base == "" {
			base = "CNY"
		}
		rates, updatedAt, err := fetchRates(base)
		if err != nil || rates == nil {
			continue
		}

		// Filter rates to only used currencies
		usedCurrencies := make(map[string]bool)
		usedCurrencies[strings.ToUpper(base)] = true
		
		var subs []domain.Subscription
		if err := db.Where("user_id = ?", u.ID).Find(&subs).Error; err == nil {
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

		u.Settings.BaseCurrency = strings.ToUpper(base)
		u.Settings.CurrencyRates = filteredRates
		u.Settings.RatesUpdatedAt = updatedAt
		_ = saveSettings(db, u.ID, u.Settings)
	}
}

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

// saveSettings marshals settings to JSON string for SQLite storage.
func saveSettings(db *gorm.DB, userID uint, settings domain.UserSettings) error {
	bytes, err := json.Marshal(settings)
	if err != nil {
		return err
	}
	return db.Exec("UPDATE users SET settings = ? WHERE id = ?", string(bytes), userID).Error
}

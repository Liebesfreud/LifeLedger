package util

import (
	"fmt"
	"net/smtp"
	"subtrack/internal/domain"
)

// SendEmail sends a simple text email using the provided settings.
func SendEmail(settings domain.EmailSettings, toEmail, subject, body string) error {
	if !settings.Enabled {
		return fmt.Errorf("email not enabled")
	}

	auth := smtp.PlainAuth("", settings.SMTPUser, settings.SMTPPassword, settings.SMTPServer)
	
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", toEmail, subject, body))

	addr := fmt.Sprintf("%s:%d", settings.SMTPServer, settings.SMTPPort)
	return smtp.SendMail(addr, auth, settings.FromEmail, []string{toEmail}, msg)
}

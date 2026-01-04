package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Client struct {
	Token  string
	ChatID string
}

type sendMessagePayload struct {
	ChatID string `json:"chat_id"`
	Text   string `json:"text"`
}

// SendMessage posts a simple text message. Returns nil if token/chat are empty.
func (c Client) SendMessage(text string) error {
	if c.Token == "" || c.ChatID == "" {
		return nil
	}
	body, _ := json.Marshal(sendMessagePayload{ChatID: c.ChatID, Text: text})
	url := fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", c.Token)
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return fmt.Errorf("telegram send failed: %s", resp.Status)
	}
	return nil
}

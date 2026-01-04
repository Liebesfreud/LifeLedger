package constants

var (
	AllowedCurrencies   = []string{"CNY", "USD", "EUR", "GBP", "JPY"}
	AllowedBillingCycle = []string{"weekly", "monthly", "quarterly", "yearly"}
)

func IsValidCurrency(v string) bool {
	for _, c := range AllowedCurrencies {
		if v == c {
			return true
		}
	}
	return false
}

func IsValidBillingCycle(v string) bool {
	for _, c := range AllowedBillingCycle {
		if v == c {
			return true
		}
	}
	return false
}

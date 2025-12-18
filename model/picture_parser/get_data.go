package PictureParser

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/genai"
)

func GetData(ctx *context.Context, client *genai.Client, payload []*genai.Part, model string) (response string, success bool) {
	promt := `
You are a forensic document analyzer. You are processing Belarusian Waybills (TTN-1).

### INSTRUCTIONS FOR ACCURACY
1. **Visual Grid Reading:** The "Description/Name" column (Column 2) often contains **multiple lines of text** in a single cell. You MUST read ALL lines in that box (top to bottom) and combine them into a single string.
2. **Do Not Hallucinate:** If the text is blurry, transcribe what you see visually. Do NOT guess brand names (e.g., do NOT change "ZACATERA" to "Bacardi" just because they look similar).
3. **Ignore Stamps:** Ignore circular blue stamps or handwritten signatures that overlap the text. Focus only on the printed table data.

### ATTACHMENT LOGIC
1. Look at the Main Table. Does it have a row saying "Goods according to appendix" (Товар согласно приложения)?
2. **YES:** 
   - Set "has_attachment": true.
   - Extract the page count.
   - **STOP** reading items from this page.
   - Extract items **ONLY** from the other images provided.
3. **NO:** 
   - Set "has_attachment": false.
   - Extract items from this table normally.

### OUTPUT JSON (Strict Format)
{
  "processing_metadata": {
    "has_attachment": boolean,
    "attachment_page_count": integer
  },
  "document_header": {
    "document_number": "string",
    "document_date": "string",
    "sender_name": "string",
    "receiver_name": "string",
    "total_amount_with_vat": number
  },
  "items": [
    {
      "row_number": "string",
      "description": "string (The COMPLETE text from Column 2, including Country, Code, and Brand)",
      "unit": "string",
      "quantity": number,
      "price_per_unit": number,
      "cost_without_vat": number,
      "vat_rate_percent": number,
      "vat_amount": number,
      "cost_with_vat": number,
      "packages_count": number,
      "mass_tonnes": number,
      "note": "string"
    }
  ],
  "totals": {
    "total_quantity": number,
    "total_cost_without_vat": number,
    "total_vat_amount": number,
    "total_cost_with_vat": number,
    "total_packages": number,
    "total_mass_tonnes": number
  }
}
`
	payload = append(payload, &genai.Part{Text: promt})
	var finalResponse string
	genConfig := &genai.GenerateContentConfig{
		Temperature:      genai.Ptr(float32(0.1)), // Only pick the single most likely next word
		ResponseMIMEType: "application/json",
	}
	success = false

	for i := 0; i < 5; i++ {
		resp, err := client.Models.GenerateContent(*ctx, model, []*genai.Content{
			{Parts: payload},
		}, genConfig)

		if err == nil {
			if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
				finalResponse = resp.Candidates[0].Content.Parts[0].Text
				success = true
				break
			}
		}

		// If error is 503 (Overloaded), wait and retry
		fmt.Printf("Attempt %d failed or overloaded. Retrying...\n\tErr: %v\n", i+1, err)
		time.Sleep(2 * time.Second)
	}

	if !success {
		log.Println("Google Gemini API is overloaded or failed. Please try again.")
		return "", success
	}

	return finalResponse, success
}

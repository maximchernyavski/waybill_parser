package PictureParser

import (
	"context"
	"fmt"
	"log"
	"time"

	"google.golang.org/genai"
)

func GetData(ctx *context.Context, client *genai.Client, payload []*genai.Part, model string) (response string, success bool) {
	promt := `You are an expert document parser for Belarusian/Russian invoicing documents (TN-2 / TTN-1).
I have provided one or more images representing a single document.

YOUR TASK:
Analyze all images to extract data into a single, consolidated JSON object.

LOGIC FLOW:
1. Scan the "Name of goods" (Наименование товара) column in the main table.
2. Check for "Attachment Indicators": Look for phrases like "Товар согласно приложения" (Goods according to appendix) or "приложения на X листах" (appendix on X sheets).
3. IF "Attachment Indicator" IS FOUND:
   - Set "has_attachment": true.
   - Extract the number of pages mentioned (e.g., "на 2 листах" -> 2) into "attachment_page_count".
   - IGNORE the row containing the "Attachment Indicator" when building the items list.
   - Extract line items ONLY from the other images (the detailed attachment pages) and merge them into one single "items" array.
4. IF "Attachment Indicator" IS NOT FOUND:
   - Set "has_attachment": false.
   - Set "attachment_page_count": 0.
   - Extract all line items normally from the table.

DATA EXTRACTION RULES:
- Extract the document header info (Number, Date, Buyer, Seller, Total Amount) from the main Summary Page (usually the one with signatures and transport details).
- Combine all line items from all available pages into the 'items' array.
- Maintain the exact JSON structure below.

JSON STRUCTURE (Return ONLY this JSON, no markdown formatting):
{
  "processing_metadata": {
    "has_attachment": boolean,
    "attachment_page_count": integer,
    "parsing_notes": "string (e.g., 'Found summary row on page 2, extracted items from pages 1 and 3')"
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
      "name": "string",
      "unit": "string",
      "quantity": number,
      "price_per_unit": number,
      "total_cost_no_vat": number,
      "vat_rate_percent": number,
      "vat_amount": number,
      "total_cost_with_vat": number
    }
  ]
}`
	payload = append(payload, &genai.Part{Text: promt})
	var finalResponse string
	success = false

	for i := 0; i < 3; i++ {
		resp, err := client.Models.GenerateContent(*ctx, model, []*genai.Content{
			{Parts: payload},
		}, nil)

		if err == nil {
			if len(resp.Candidates) > 0 && len(resp.Candidates[0].Content.Parts) > 0 {
				finalResponse = resp.Candidates[0].Content.Parts[0].Text
				success = true
				break
			}
		}

		// If error is 503 (Overloaded), wait and retry
		fmt.Printf("Attempt %d failed or overloaded. Retrying...\n", i+1)
		time.Sleep(2 * time.Second)
	}

	if !success {
		log.Println("Google Gemini API is overloaded or failed. Please try again.")
		return "", success
	}

	return finalResponse, success
}

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

### HEADER EXTRACTION RULES (STRICT):
1. **Locate "Грузополучатель" (Receiver):**
   - Find the exact printed label: "Грузополучатель:".
   - The name starts **immediately after** or **below** this label.
   - **CRITICAL:** Do NOT extract the text next to "Заказчик" (Customer) or "Плательщик" (Payer).
   - Stop reading the name when you see the address or the UNP number.

2. **Locate "Грузоотправитель" (Sender):**
   - Find the label "Грузоотправитель:".
   - Extract the name associated with this specific label.

3. **UNP (Tax ID):** 
   - Look for the 9-digit number near the extracted Name.

### NAME CLEANING RULES (Crucial):
For every row, you must generate TWO fields for Column 2:
1. "description": The verbatim text including all codes.
2. "name": A cleaned version based on these rules:
   - **KEEP:** Product type, Brand name, Taste/Type (Dry/Semi-dry), Alcohol %, Volume, and **Country of Origin** (Страна происхождения).
   - **REMOVE:** Internal SKU numbers at the start (e.g., "27473..."), Barcodes (ш/к), GTIN, Customs Codes (ТН ВЭД, ОКРБ).
   - **REMOVE:** "Country of Import" (Страна ввоза) - only keep Origin.
   - **FORMAT:** Keep it clean and readable.

#### EXAMPLES OF "SHORT_NAME" GENERATION:
**Input:** "Настойка горькая ЦАРСКАЯ ОРИГИНАЛЬНАЯ Ваниль/ Czar's Original Vanilla, 38%, 0,5л; страна ввоза - Россия; страна происхождения - Россия; ш/к 4603514015056; ОКРБ 11.01.10.853;"
**Output:** "Настойка горькая ЦАРСКАЯ ОРИГИНАЛЬНАЯ Ваниль, 38%, 0,5л; страна происхождения - Россия;"

**Input:** "274731523 Водка "MAD DOG", чистая 40%, 0.5л, Беларусь.; ш/к 4813852006696; GTIN 4813852006696"
**Output:** "Водка "MAD DOG", чистая 40%, 0.5л, Беларусь.;"

**Input:** "Вино виноградное натуральное St. Giorgio Primitivo Puglia / Сэйнт Джорджио Примитиво Апулия выдержанное... категория IGT, 13% 0,75л; страна ввоза - Италия; страна происхождения - Италия; ш/к 800215..."
**Output:** "Вино виноградное натуральное St. Giorgio Primitivo Puglia, выдержанное, красное полусухое, 13% 0,75л; страна происхождения - Италия;"

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
    "total_amount_with_vat": number
	"sender_info": {
      "name": "string",
      "unp": "string (The 9-digit tax ID)"
    },
    "receiver_info": {
      "name": "string",
      "unp": "string (The 9-digit tax ID)"
    },
  },
  "items": [
    {
      "row_number": "string",
      "description": "string (The COMPLETE text from Column 2, including Country, Code, and Brand)",
	  "name": "string(The cleaned name based on rules above)",
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

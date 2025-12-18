package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"
	PictureTuner "waybil_parser/model/picture_tuner"

	"github.com/joho/godotenv"
	_ "github.com/joho/godotenv/autoload"
	"google.golang.org/genai"
)

func main() {
	err := godotenv.Load("secrets.env")
	if err != nil {
		log.Fatal("Could not load .env")
	}
	apiKey := os.Getenv("GEMINI_API_KEY")
	PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/0151009/0151009_skewed.jpg")
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Оригиналы/0468063/0468063.jpg")
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/6277215/6277215.jpg")
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/4646616/4646616.jpg")
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Горизонтальные/0216538/02165380001.jpg")
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Горизонтальные/0216538/02165380002.jpg")

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{APIKey: apiKey})
	if err != nil {
		log.Fatal(err)
	}

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

	imgBytes, err := os.ReadFile("final_deskewed.png")
	if err != nil {
		log.Fatalln("Can't read file")
	}

	model := "gemini-2.5-flash"

	// 3. Create the Content with both Text and Image parts
	// Note: You can change the order (Image first or Text first)
	parts := []*genai.Part{
		{Text: promt},
		{InlineData: &genai.Blob{
			Data:     imgBytes,
			MIMEType: "image/png", // Change to "image/png" if needed
		}},
	}

	var resp *genai.GenerateContentResponse
	// 4. Send the request
	for i := 0; i < 5; i++ {
		resp, err = client.Models.GenerateContent(ctx, model, []*genai.Content{
			{Parts: parts},
		}, nil)

		if err == nil {
			break // Success! Exit the loop
		}

		// If error is 503, wait and retry
		log.Println(err)
		fmt.Println("Model overloaded, retrying in 4 seconds...")
		time.Sleep(4 * time.Second)
	}

	if err != nil {
		log.Fatal(err)
	}

	// 5. Print the response
	fmt.Println(resp.Candidates[0].Content.Parts[0].Text)

	// err = os.Remove("final_deskewed.bmp")
	// if err != nil {
	// 	log.Println("Can't delete file")
	// 	log.Fatal(err)
	// }
	// err = os.Remove("debug_solid_grid.bmp")
	// if err != nil {
	// 	log.Println("Can't delete file")
	// 	log.Fatal(err)
	// }
	// err = os.Remove("debug_detected_cells.bmp")
	// if err != nil {
	// 	log.Println("Can't delete file")
	// 	log.Fatal(err)
	// }
}

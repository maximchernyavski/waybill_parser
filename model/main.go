package main

import (
	Server "waybil_parser/model/server"
)

func main() {
	// err := godotenv.Load("secrets.env")
	// if err != nil {
	// 	log.Fatal("Could not load .env ", err)
	// }

	// apiKey := os.Getenv("GEMINI_API_KEY")

	// ctx := context.Background()
	// client, err := genai.NewClient(ctx, &genai.ClientConfig{APIKey: apiKey})
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// imgBytes, err := os.ReadFile("final_deskewed.png")
	// if err != nil {
	// 	log.Fatalln("Can't read file")
	// }

	// model := "gemini-2.5-flash"

	// // 3. Create the Content with both Text and Image parts
	// // Note: You can change the order (Image first or Text first)
	// parts := []*genai.Part{
	// 	{Text: promt},
	// 	{InlineData: &genai.Blob{
	// 		Data:     imgBytes,
	// 		MIMEType: "image/png", // Change to "image/png" if needed
	// 	}},
	// }

	// var resp *genai.GenerateContentResponse
	// // 4. Send the request
	// for i := 0; i < 5; i++ {
	// 	resp, err = client.Models.GenerateContent(ctx, model, []*genai.Content{
	// 		{Parts: parts},
	// 	}, nil)

	// 	if err == nil {
	// 		break // Success! Exit the loop
	// 	}

	// 	// If error is 503, wait and retry
	// 	log.Println(err)
	// 	fmt.Println("Model overloaded, retrying in 4 seconds...")
	// 	time.Sleep(4 * time.Second)
	// }

	// if err != nil {
	// 	log.Fatal(err)
	// }

	// // 5. Print the response
	// fmt.Println(resp.Candidates[0].Content.Parts[0].Text)

	Server.StartServer("8080")

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

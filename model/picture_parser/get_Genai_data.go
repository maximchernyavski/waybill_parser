package PictureParser

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"google.golang.org/genai"
)

var apiKey string

func GetData(prompt *genai.Part, ctx *context.Context, client *genai.Client, payload []*genai.Part, model string) (response string, success bool) {
	apiKey = os.Getenv("GEMINI_API_KEY")
	payload = append(payload, prompt)
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

func GetTTNDataOverGemini(parts *[]*genai.Part) (string, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	finalResponse, success := GetData(&genai.Part{Text: promptTTN}, &ctx, client, *parts, "gemini-3-flash-preview")

	if !success {
		return "", errors.New("unaible to get data from GeminiAPI")
	}

	return finalResponse, nil
}

func GetACTDataOverGemini(parts *[]*genai.Part) (string, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	finalResponse, success := GetData(&genai.Part{Text: promptAct}, &ctx, client, *parts, "gemini-3-flash-preview")

	if !success {
		return "", errors.New("unaible to get data from GeminiAPI")
	}

	return finalResponse, nil
}

func RouteTheProcessWGemini(parts *[]*genai.Part) (int, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	// models, err := client.Models.List(ctx, &genai.ListModelsConfig{})
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// fmt.Println("List of models that support generateContent:")
	// for _, m := range models.Items {
	// 	for _, action := range m.SupportedActions {
	// 		if action == "generateContent" {
	// 			fmt.Println(m.Name)
	// 			break
	// 		}
	// 	}
	// }

	finalResponse, success := GetData(&genai.Part{Text: promptRouter}, &ctx, client, *parts, "gemini-2.5-flash")
	finalResponse = strings.ReplaceAll(finalResponse, "\"", "")

	if !success {
		return 0, errors.New("unaible to get data from GeminiAPI")
	}

	if responseComparison[finalResponse] == 0 {
		log.Println("Couldn't recognize the document")
		return 0, errors.New("document type was not recognized")
	}

	return responseComparison[finalResponse], nil
}

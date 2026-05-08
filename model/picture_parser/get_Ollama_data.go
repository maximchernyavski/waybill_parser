package PictureParser

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	Models "waybil_parser/model/models"
)

var ollamaAddress string

func AskOllamaModel(request Models.OllamaRequest) (Models.OllamaResponse, error) {
	ollamaAddress = os.Getenv("OLLAMA_ADDRESS")
	if request.Prompt == "" {
		log.Println("Empty Ollama prompt")
		return Models.OllamaResponse{}, errors.New("cannot send empty prompted request")
	}

	requestData, err := json.Marshal(request)
	if err != nil {
		log.Println("Can't convert request to JSON")
		return Models.OllamaResponse{}, err
	}

	response, err := http.Post(ollamaAddress, "application/json", bytes.NewBuffer(requestData))
	if err != nil {
		log.Println("Can't send/receive request to Ollama")
		return Models.OllamaResponse{}, err
	}
	defer response.Body.Close()

	responseBody, _ := io.ReadAll(response.Body)

	log.Println("Response ===> ", string(responseBody))

	var ollamaResponse Models.OllamaResponse
	err = json.Unmarshal(responseBody, &ollamaResponse)
	if err != nil {
		log.Println("Can't unmarshall response body")
		return Models.OllamaResponse{}, err
	}

	log.Println("Ollama Response ===> ", ollamaResponse)

	return ollamaResponse, nil
}

func ParseTTNWOllama(images *[]string) (Models.OllamaResponse, error) {
	request := Models.OllamaRequest{
		Model:     "https://ollama.com/ingu627/Qwen2.5-VL-7B-Instruct-Q5_K_M", //qwen3.5:latest  minicpm-v:8b-2.6-q4_K_M
		Prompt:    promptTTN,
		Images:    *images,
		Stream:    false,
		KeepAlive: 0,
		Options: map[string]interface{}{
			"num_ctx":     16384,
			"temperature": 0.0,
		},
	}

	timer := time.Now()
	response, err := AskOllamaModel(request)
	if err != nil {
		log.Println("Увы")
		return Models.OllamaResponse{}, err
	}
	log.Println("Time to finish ===> ", time.Since(timer))
	return response, nil
	// return AskOllamaModel(request)
}

func ParseACTWOllama(images *[]string) (Models.OllamaResponse, error) {
	request := Models.OllamaRequest{
		Model:     "https://ollama.com/ingu627/Qwen2.5-VL-7B-Instruct-Q5_K_M", //qwen3.5:latest  minicpm-v:8b-2.6-q4_K_M
		Prompt:    promptAct,
		Images:    *images,
		Stream:    false,
		KeepAlive: 0,
		Options: map[string]interface{}{
			"num_ctx":     16384,
			"temperature": 0.0,
		},
	}

	timer := time.Now()
	response, err := AskOllamaModel(request)
	if err != nil {
		log.Println("Увы")
		return Models.OllamaResponse{}, err
	}
	log.Println("Time to finish ===> ", time.Since(timer))
	return response, nil
	// return AskOllamaModel(request)
}

func RouteTheProcessWOllama(images *[]string) (int, error) {
	request := Models.OllamaRequest{
		Model:     "https://ollama.com/ingu627/Qwen2.5-VL-7B-Instruct-Q5_K_M", //qwen3.5:latest  minicpm-v:8b-2.6-q4_K_M
		Prompt:    promptRouter,
		Images:    *images,
		Stream:    false,
		KeepAlive: 0,
		Options: map[string]interface{}{
			"num_ctx":     16384,
			"temperature": 0.0,
		},
	}

	timer := time.Now()
	response, err := AskOllamaModel(request)
	finalResponse := strings.ReplaceAll(response.Response, "\"", "")
	if err != nil {
		log.Println("Увы")
		return 0, err
	}
	log.Println("Time to finish ===> ", time.Since(timer))

	if responseComparison[finalResponse] == 0 {
		log.Println("Can't identify document with %s", response.Model)
		return 0, errors.New("can't identify document type with ollama services")
	}

	return responseComparison[finalResponse], nil
	// return response, nil
	// return AskOllamaModel(request)
}

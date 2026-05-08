package Server

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"io"
	"log"
	"net/http"
	Misc "waybil_parser/model/misc"
	Models "waybil_parser/model/models"
	PictureParser "waybil_parser/model/picture_parser"
	PictureTuner "waybil_parser/model/picture_tuner"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gocv.io/x/gocv"
	"google.golang.org/genai"
)

/*
Mode represents current mode for parsing (genai or local), where:
0 - genai
1 - local
*/
var mode bool = false

func StartServer(port string) {
	err := godotenv.Load("secret.env")
	if err != nil {
		log.Fatal("Could not load .env", err)
	}

	// 2. Setup Gin
	r := gin.Default()

	// Set max upload size (e.g., 8MB)
	r.MaxMultipartMemory = 100 << 20
	r.Use(cors.Default())

	// 3. Define the Route
	r.POST("/process-document", handleDocumentUpload)

	err = r.Run(fmt.Sprintf(":%s", port))
	if err != nil {
		log.Fatalln("Can't run server", err)
	}

	fmt.Printf("Server running on port %s...", port)
}

func handleDocumentUpload(c *gin.Context) {
	// Parse Multipart Form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	// Get files from the form key "files" (allows multiple)
	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded. Use form key 'files'"})
		return
	}

	// Prepare Gemini Parts
	var parts []*genai.Part
	var images []string

	// Loop through uploaded images and append them
	for _, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
			return
		}
		defer file.Close()

		// Read file bytes
		fileBytes, err := io.ReadAll(file)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file bytes"})
			return
		}

		img, _, err := image.Decode(bytes.NewReader(fileBytes))
		if err != nil {
			log.Println("Image didn't successeeded")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode image bytes"})
			return
		}

		// mat, err := gocv.IMDecode(fileBytes, gocv.IMReadColor)
		// if err != nil {
		// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert file bytes"})
		// 	return
		// }
		// defer mat.Close()

		mat, err := gocv.ImageToMatRGB(img)
		if err != nil {
			log.Println("Can't convert image to gocv.Mat")
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert image to mat"})
			return
		}

		gocv.CvtColor(mat, &mat, gocv.ColorRGBToBGR)

		mat = PictureTuner.PrepareMat(mat)

		if mode {
			err = PictureTuner.CompressMat(&mat, 2200)
			if err != nil {
				log.Println("Can't resize gocv.Mat")
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to resize image"})
				return
			}
		}

		// gocv.IMWrite(fmt.Sprintf("debug_%d.bmp", i), mat)
		fileBytesBuff, err := gocv.IMEncode(".png", mat)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert file bytes"})
			return
		}
		fileBytes = fileBytesBuff.GetBytes()

		// Add image to parts
		// Note: fileHeader.Header.Get("Content-Type") automatically detects image/png or image/jpeg

		if mode {
			images = append(images, base64.StdEncoding.EncodeToString(fileBytes))
		} else {
			Models.FillGenaiParts(&parts, &fileBytes, fileHeader)
		}

		// parts = append(parts, &genai.Part{
		// 	InlineData: &genai.Blob{
		// 		Data:     fileBytes,
		// 		MIMEType: fileHeader.Header.Get("Content-Type"),
		// 	},
		// })
	}

	var documentType int
	var finalResponse string
	var ollamaResponse Models.OllamaResponse

	log.Println("Request sent")
	if mode {
		documentType, err = PictureParser.RouteTheProcessWOllama(&images)
		if err != nil {
			log.Println(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ollama services error: can't recognize document type"})
			return
		}

		if documentType == 1 {
			ollamaResponse, err = PictureParser.ParseTTNWOllama(&images)
		} else {
			ollamaResponse, err = PictureParser.ParseACTWOllama(&images)
		}

		if err != nil {
			log.Println(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Ollama error"})
			return
		}
		finalResponse = ollamaResponse.Thinking
	} else {
		documentType, err = PictureParser.RouteTheProcessWGemini(&parts)
		if err != nil {
			log.Println(err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Genai error: can't recognize document type"})
			return
		}

		if documentType == 1 {
			finalResponse, err = PictureParser.GetTTNDataOverGemini(&parts)
		} else {
			finalResponse, err = PictureParser.GetACTDataOverGemini(&parts)
		}

		if err != nil {
			log.Println(err)
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google Gemini API is overloaded or failed. Please try again."})
			return
		}
	}

	// ctx := context.Background()
	// client, err := genai.NewClient(ctx, &genai.ClientConfig{
	// 	APIKey:  apiKey,
	// 	Backend: genai.BackendGeminiAPI,
	// })
	// if err != nil {
	// 	log.Fatal(err)
	// }

	// finalResponse, success := PictureParser.GetData(&ctx, client, parts, "gemini-3-flash-preview")

	// if !success {
	// 	c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google Gemini API is overloaded or failed. Please try again."})
	// 	return
	// }

	// Clean Markdown tags (```json ... ```)
	jsonRaw := Misc.CleanJSON(finalResponse)

	log.Println("Final Response ===> ", finalResponse)

	// Return raw JSON string (or you could Unmarshal it into a struct to validate it)
	c.Data(http.StatusOK, "application/json", []byte(jsonRaw))
}

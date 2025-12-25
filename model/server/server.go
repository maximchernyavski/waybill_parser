package Server

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	Misc "waybil_parser/model/misc"
	PictureParser "waybil_parser/model/picture_parser"
	PictureTuner "waybil_parser/model/picture_tuner"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gocv.io/x/gocv"
	"google.golang.org/genai"
)

var apiKey string

func StartServer(port string) {
	err := godotenv.Load("secret.env")
	if err != nil {
		log.Fatal("Could not load .env", err)
	}

	apiKey = os.Getenv("GEMINI_API_KEY")

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

	fmt.Printf("Server running on port %s...")
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

		mat, err := gocv.IMDecode(fileBytes, gocv.IMReadColor)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert file bytes"})
			return
		}
		defer mat.Close()

		mat = PictureTuner.PrepareMat(mat)
		// gocv.IMWrite(fmt.Sprintf("debug_%d.bmp", i), mat)
		fileBytesBuff, err := gocv.IMEncode(".png", mat)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to convert file bytes"})
			return
		}
		fileBytes = fileBytesBuff.GetBytes()

		// Add image to parts
		// Note: fileHeader.Header.Get("Content-Type") automatically detects image/png or image/jpeg
		parts = append(parts, &genai.Part{
			InlineData: &genai.Blob{
				Data:     fileBytes,
				MIMEType: fileHeader.Header.Get("Content-Type"),
			},
		})
	}

	ctx := context.Background()
	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		log.Fatal(err)
	}

	finalResponse, success := PictureParser.GetData(&ctx, client, parts, "gemini-3-flash-preview")

	if !success {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google Gemini API is overloaded or failed. Please try again."})
		return
	}

	// Clean Markdown tags (```json ... ```)
	jsonRaw := Misc.CleanJSON(finalResponse)

	log.Println(finalResponse)

	// Return raw JSON string (or you could Unmarshal it into a struct to validate it)
	c.Data(http.StatusOK, "application/json", []byte(jsonRaw))
}

package PictureParser

import (
	"fmt"
	"image"
	"log"
	"os"

	Misc "waybil_parser/model/misc"

	"github.com/otiai10/gosseract"
)

type Field struct {
	Name       string
	X, Y, W, H int                   // Coordinates
	Language   string                // "rus", "eng", or both
	Whitelist  string                // Allowed characters (optional)
	PSM        gosseract.PageSegMode // How to scan (block, single line, etc.)
}

func RecognizeMarkedPage(picturePath string) {
	imgFile, err := os.Open(picturePath)
	if err != nil {
		log.Fatal(err)
	}
	defer imgFile.Close()

	// 2. Decode the image so Go can manipulate it
	srcImg, _, err := image.Decode(imgFile)
	if err != nil {
		log.Fatal(err)
	}

	// 3. Define your fields based on your image structure
	// Tip: Use MS Paint or GIMP to find these X,Y coordinates
	fields := []Field{
		{
			Name: "Full Name",
			X:    1000, Y: 340, W: 1350, H: 209, // Example coordinates
			Language: "rus",
			PSM:      gosseract.PSM_SINGLE_LINE, // Expect just one line of text
		},
		{
			Name: "ID Number",
			X:    1015, Y: 400, W: 1350, H: 200, // Example coordinates
			Language:  "rus",
			Whitelist: "0123456789", // TRICK: Force it to only see numbers!
			PSM:       gosseract.PSM_SINGLE_WORD,
		},
	}

	// 4. Initialize Tesseract
	client := gosseract.NewClient()
	defer client.Close()

	fmt.Println("--- Processing Structured Image ---")

	for _, field := range fields {
		// A. Crop the image to the specific field
		croppedImg := Misc.CropImage(srcImg, field.X, field.Y, field.W, field.H)

		// B. Pass the image bytes to Gosseract
		// We use a helper to convert the Go image to a format Tesseract likes
		err := client.SetImageFromBytes(Misc.ImgToBytes(croppedImg))
		if err != nil {
			log.Println("Error loading image for", field.Name, err)
			continue
		}

		// C. Apply specific settings for this field
		client.SetLanguage(field.Language)
		client.SetPageSegMode(field.PSM)
		client.SetWhitelist(field.Whitelist) // Extremely powerful for accuracy!

		// D. Recognize
		text, _ := client.Text()
		fmt.Printf("[%s]: %s\n", field.Name, text)

		// Reset whitelist for next iteration so it doesn't leak
		client.SetWhitelist("")
	}
}

func RecognizeRusEngText(picturePath string) {
	// 1. Create a new Tesseract client
	client := gosseract.NewClient()
	defer client.Close()

	// 2. Set the languages to English ("eng") and Russian ("rus")
	// The order typically doesn't matter, but Tesseract will look for characters from both sets.
	if err := client.SetLanguage("eng", "rus"); err != nil {
		log.Fatalf("Error setting language: %v", err)
	}

	// 3. Set the path to your image file
	// Replace 'image.png' with the actual path to your picture
	if err := client.SetImage(picturePath); err != nil {
		log.Fatalf("Error setting image: %v", err)
	}

	// 4. Perform the OCR (Text recognition)
	text, err := client.Text()
	if err != nil {
		log.Fatalf("Error recognizing text: %v", err)
	}

	// 5. Print the result
	fmt.Println("--- Recognized Text ---")
	fmt.Println(text)
	fmt.Println("-----------------------")
}

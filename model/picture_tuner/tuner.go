package PictureTuner

import (
	"image"
	"log"
	Misc "waybil_parser/model/misc"

	"github.com/disintegration/imaging"
	"github.com/otiai10/gosseract"
)

func PrepareImprovedImage(picturePath string) {
	srcImg, err := imaging.Open(picturePath)
	if err != nil {
		log.Fatalf("Failed to open image: %v", err)
	}

	img := adjustImage(srcImg)

	client := gosseract.NewClient()
	defer client.Close()

	if err := client.SetLanguage("eng", "rus"); err != nil {
		log.Fatalf("Error setting language: %v", err)
	}

	// 3. Convert image to bytes for Tesseract
	// (Reusing the helper from previous examples)
	imgBytes := Misc.ImgToBytes(img)
	client.SetImageFromBytes(imgBytes)

	// 3. (Optional) Save the processed image to check if it looks better
	//    This helps you debug if your settings (40, 0.5) are correct.
	err = imaging.Save(img, "debug_processed.png")
	if err != nil {
		log.Fatalf("Failed to save debug image: %v", err)
	}
}

func adjustImage(image image.Image) image.Image {
	//    This removes color noise. Tesseract works best on B&W or Grayscale.
	image = imaging.Grayscale(image)

	//    Value ranges from -100 to 100.
	//    Try values between 20 and 50. If it's very blurry, try higher.
	image = imaging.AdjustContrast(image, 40)

	//    Helps if the image is slightly out of focus.
	//    Sigma values around 0.5 to 2.0 usually work well.
	image = imaging.Sharpen(image, 0.5)

	return image
}

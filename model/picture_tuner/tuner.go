package PictureTuner

import (
	"fmt"
	"log"

	"gocv.io/x/gocv"
)

func PrepareImprovedImage(picturePath string) {
	deskew(picturePath)

	img := gocv.IMRead("final_deskewed.jpg", gocv.IMReadColor)
	if img.Empty() {
		log.Fatal("Could not read image")
	}
	defer img.Close()

	binarizeForTesseract(&img)

	isWritten := gocv.IMWrite("final_deskewed.jpg", img)
	if !isWritten {
		fmt.Println("File was not saved")
		log.Fatal("Can't write file")
	}
}

func binarizeForTesseract(mat *gocv.Mat) {
	// Convert to grayscale if not already
	if mat.Channels() > 1 {
		tmp := gocv.NewMat()
		gocv.CvtColor(*mat, &tmp, gocv.ColorBGRToGray)
		mat.Close()
		*mat = tmp
	}

	// Apply simple binary thresholding or adaptive
	// Simple is often better if lighting is even (scanned docs)
	// 180 is a safe bet for dark text on white paper
	gocv.Threshold(*mat, mat, 200, 255, gocv.ThresholdBinary)

	// OR if you have shadows/uneven light, use Adaptive again:
	// gocv.AdaptiveThreshold(*mat, mat, 255, gocv.AdaptiveThresholdGaussian, gocv.ThresholdBinary, 11, 2)
}

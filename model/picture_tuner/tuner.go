package PictureTuner

import (
	"fmt"
	"log"
	"os"

	"gocv.io/x/gocv"
)

func PrepareImprovedImage(picturePath string) {
	img := gocv.IMRead(picturePath, gocv.IMReadColor)
	if img.Empty() {
		log.Fatal("Could not read image")
	}
	defer img.Close()

	img = fixOrientation(img)
	deskew(&img)

	img = gocv.IMRead("final_deskewed.bmp", gocv.IMReadColor)
	if img.Empty() {
		log.Fatal("Could not read image")
	}

	binarizeForTesseract(&img)
	healGaps(&img)

	isWritten := gocv.IMWrite("final_deskewed.png", img)
	if !isWritten {
		fmt.Println("Another file")
		fmt.Println("File was not saved")
		log.Fatal("Can't write file")
	}
}

func PrepareMat(img gocv.Mat) gocv.Mat {
	img = fixOrientation(img)
	deskew(&img)

	img = gocv.IMRead("final_deskewed.bmp", gocv.IMReadColor)
	if img.Empty() {
		log.Fatal("Could not read image")
	}

	binarizeForTesseract(&img)
	healGaps(&img)

	os.Remove("final_deskewed.bmp")

	isWritten := gocv.IMWrite("final_deskewed.png", img)
	if !isWritten {
		fmt.Println("Another file")
		fmt.Println("File was not saved")
		log.Fatal("Can't write file")
	}

	return img
}

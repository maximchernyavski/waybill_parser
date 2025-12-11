package PictureTuner

import (
	"fmt"
	"image"
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
	// img = gocv.IMRead("fixed_rotation.bmp", gocv.IMReadColor)
	// if img.Empty() {
	// 	log.Fatal("Could not read image")
	// }
	deskew(&img)

	img = gocv.IMRead("final_deskewed.bmp", gocv.IMReadColor)
	if img.Empty() {
		log.Fatal("Could not read image")
	}
	err := os.Remove("fixed_rotation.bmp")
	if err != nil {
		log.Fatal("Can't remove rotation file")
	}

	binarizeForTesseract(&img)
	healGaps(&img)

	isWritten := gocv.IMWrite("final_deskewed.bmp", img)
	if !isWritten {
		fmt.Println("Another file")
		fmt.Println("File was not saved")
		log.Fatal("Can't write file")
	}
}

func binarizeForTesseract(mat *gocv.Mat) {
	// 1. Grayscale
	if mat.Channels() > 1 {
		tmp := gocv.NewMat()
		gocv.CvtColor(*mat, &tmp, gocv.ColorBGRToGray)
		mat.Close()
		*mat = tmp
	}

	// 2. Analyze Background Stats
	// We resize to 25% to make this check instant
	small := gocv.NewMat()
	defer small.Close()
	gocv.Resize(*mat, &small, image.Point{X: 0, Y: 0}, 0.25, 0.25, gocv.InterpolationLinear)

	// Calculate background of the small image
	bgSmall := gocv.NewMat()
	defer bgSmall.Close()
	kernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 15, Y: 15}) // ~40x40 on full size
	defer kernel.Close()
	gocv.MorphologyEx(small, &bgSmall, gocv.MorphClose, kernel)

	// Measure standard deviation
	mean := gocv.NewMat()
	defer mean.Close()
	stdDev := gocv.NewMat()
	defer stdDev.Close()
	gocv.MeanStdDev(bgSmall, &mean, &stdDev)

	variation := stdDev.GetDoubleAt(0, 0)
	fmt.Println("Variation ====> ", variation)

	// USER FINDING: Wavy images have LOWER variation than Plain images.
	// Adjust this threshold based on your specific dataset testing.
	const threshold = 20.0

	if variation < threshold {
		// --- LOGIC A: WAVY / TEXTURED IMAGE ---
		// Needs "Illumination Compensation" to flatten the waves.

		fullBg := gocv.NewMat()
		defer fullBg.Close()

		// 40x40 Kernel to estimate the wave shape
		fullKernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 40, Y: 40})
		defer fullKernel.Close()
		gocv.MorphologyEx(*mat, &fullBg, gocv.MorphClose, fullKernel)

		// Compensation: Add (255 - Background) to Original
		white := gocv.NewMatWithSize(mat.Rows(), mat.Cols(), gocv.MatTypeCV8U)
		defer white.Close()
		white.SetTo(gocv.NewScalar(255, 0, 0, 0))

		diff := gocv.NewMat()
		defer diff.Close()
		gocv.Subtract(white, fullBg, &diff)
		gocv.Add(*mat, diff, mat)

		// Otsu finds the best cut-off for the flattened image
		gocv.Threshold(*mat, mat, 0, 255, gocv.ThresholdBinary|gocv.ThresholdOtsu)

	} else {
		// --- LOGIC B: PLAIN / GRADIENT IMAGE ---
		// Previously caused artifacts. We fix this with Denoising.

		// 1. Median Blur (The Artifact Killer)
		// This removes "salt-and-pepper" noise (single pixel dots)
		// while keeping text edges sharp.
		// Kernel size 3 is usually enough. Use 5 if noise is heavy.
		gocv.MedianBlur(*mat, mat, 3)

		// 2. Threshold
		// Since we blurred the noise away, we can safely use a high threshold
		// to keep the text bold.
		// Alternatively, use Otsu here too if lighting varies across the page.
		gocv.Threshold(*mat, mat, 235, 255, gocv.ThresholdBinary)
	}
}

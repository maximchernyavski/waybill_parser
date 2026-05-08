package PictureTuner

import (
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"

	"gocv.io/x/gocv"
)

func binarizeForTesseract(mat *gocv.Mat) {
	// Grayscale
	if mat.Channels() > 1 {
		tmp := gocv.NewMat()
		gocv.CvtColor(*mat, &tmp, gocv.ColorBGRToGray)
		mat.Close()
		*mat = tmp
	}

	// Analyze Variance to decide strategy
	small := gocv.NewMat()
	defer small.Close()
	gocv.Resize(*mat, &small, image.Point{0, 0}, 0.25, 0.25, gocv.InterpolationLinear)

	bgSmall := gocv.NewMat()
	defer bgSmall.Close()
	kernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 10, Y: 10})
	defer kernel.Close()
	gocv.MorphologyEx(small, &bgSmall, gocv.MorphClose, kernel)

	mean := gocv.NewMat()
	defer mean.Close()
	stdDev := gocv.NewMat()
	defer stdDev.Close()
	gocv.MeanStdDev(bgSmall, &mean, &stdDev)

	variation := stdDev.GetDoubleAt(0, 0)
	fmt.Println("Variation ====> ", variation)
	const threshold = 36

	if variation < threshold {
		// --- WAVY IMAGE (Low Variance) ---
		// Use Illumination Compensation + Otsu
		fullBg := gocv.NewMat()
		defer fullBg.Close()
		fullKernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 40, Y: 40})
		defer fullKernel.Close()
		gocv.MorphologyEx(*mat, &fullBg, gocv.MorphClose, fullKernel)

		white := gocv.NewMatWithSize(mat.Rows(), mat.Cols(), gocv.MatTypeCV8U)
		defer white.Close()
		white.SetTo(gocv.NewScalar(255, 0, 0, 0))

		diff := gocv.NewMat()
		defer diff.Close()
		gocv.Subtract(white, fullBg, &diff)
		gocv.Add(*mat, diff, mat)

		gocv.Threshold(*mat, mat, 0, 255, gocv.ThresholdBinary|gocv.ThresholdOtsu)
	} else {
		// --- PLAIN IMAGE (High Variance) ---
		// Use Median Blur to kill noise artifacts + Static Threshold
		gocv.MedianBlur(*mat, mat, 3)
		gocv.Threshold(*mat, mat, 200, 255, gocv.ThresholdBinary)
	}

	// Ensure we return Inverted Binary (White Lines / Black BG) for processing
	// (Table detection works best on white-on-black)
	// gocv.BitwiseNot(*mat, mat)
}

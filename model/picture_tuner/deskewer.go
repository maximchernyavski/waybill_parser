package PictureTuner

import (
	"fmt"
	"image"
	"image/color"
	"math"
	"sort"

	"gocv.io/x/gocv"
)

func deskew(img *gocv.Mat) {
	// 2. Iterative Deskew Loop
	// We allow up to 3 passes. Usually 2 is enough.
	// Rotating more than 3 times degrades image quality (blurriness).
	maxIterations := 3
	minAngleThreshold := 0.1 // If skew is less than 0.1 degrees, stop.

	for i := 0; i < maxIterations; i++ {
		angle := calculateSkewAngle(img)

		fmt.Printf("Pass %d: Detected Skew: %.4f degrees\n", i+1, angle)

		// If the angle is tiny, we are done.
		if math.Abs(angle) < minAngleThreshold {
			fmt.Println("Skew is minimal. Stopping.")
			break
		}

		// Rotate the image in-place
		rotateImage(img, angle)
	}

	gocv.IMWrite("final_deskewed.bmp", *img)
}

// rotateImage applies the rotation and updates the Mat pointer
func rotateImage(mat *gocv.Mat, angle float64) {
	// Calculate center
	center := image.Point{X: mat.Cols() / 2, Y: mat.Rows() / 2}

	// Get Rotation Matrix
	rotMat := gocv.GetRotationMatrix2D(center, angle, 1.0)
	defer rotMat.Close()

	// Create a temporary mat to hold the result
	// (We cannot warp into the same mat we are reading from)
	result := gocv.NewMat()

	// Use InterpolationCubic for best text sharpness
	// Fill newly created borders with White
	gocv.WarpAffineWithParams(*mat, &result, rotMat, image.Point{X: mat.Cols(), Y: mat.Rows()},
		gocv.InterpolationCubic, gocv.BorderConstant, color.RGBA{255, 255, 255, 0})

	// Swap the pointers: old mat is closed, new result becomes 'mat'
	mat.Close()
	*mat = result
}

func calculateSkewAngle(src *gocv.Mat) float64 {
	// Work on a copy/gray version
	gray := gocv.NewMat()
	defer gray.Close()
	gocv.CvtColor(*src, &gray, gocv.ColorBGRToGray)

	inverted := gocv.NewMat()
	defer inverted.Close()
	gocv.BitwiseNot(gray, &inverted)

	thresh := gocv.NewMat()
	defer thresh.Close()
	gocv.AdaptiveThreshold(inverted, &thresh, 255, gocv.AdaptiveThresholdMean, gocv.ThresholdBinary, 15, -2)

	// Horizontal Filter (The "Table Line" Finder)
	// We use 40x1 kernel
	kernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 20, Y: 1})
	defer kernel.Close()

	horizontalLines := gocv.NewMat()
	defer horizontalLines.Close()
	gocv.MorphologyEx(thresh, &horizontalLines, gocv.MorphOpen, kernel)

	// HoughLinesP
	lines := gocv.NewMat()
	defer lines.Close()

	// PRO TIP: I increased the theta resolution here.
	// math.Pi/180  = 1.0 degree precision
	// math.Pi/1800 = 0.1 degree precision (More accurate!)
	gocv.HoughLinesPWithParams(horizontalLines, &lines, 1, math.Pi/1800, 10, 100, 10)

	if lines.Rows() == 0 {
		return 0.0
	}

	var angles []float64
	for i := 0; i < lines.Rows(); i++ {
		v := lines.GetVeciAt(i, 0)
		x1, y1, x2, y2 := float64(v[0]), float64(v[1]), float64(v[2]), float64(v[3])

		angleRad := math.Atan2(y2-y1, x2-x1)
		angleDeg := angleRad * 180 / math.Pi

		if angleDeg > -45 && angleDeg < 45 {
			angles = append(angles, angleDeg)
		}
	}

	if len(angles) == 0 {
		return 0.0
	}

	sort.Float64s(angles)
	median := angles[len(angles)/2]

	return median
}

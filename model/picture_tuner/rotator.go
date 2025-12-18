package PictureTuner

import (
	"fmt"
	"image"
	"math"

	"github.com/otiai10/gosseract"
	"gocv.io/x/gocv"
)

func fixOrientation(img gocv.Mat) gocv.Mat {
	// 1. Determine the Axis (Portrait vs Landscape) using Lines
	isSideways := IsImageSideways(img)

	var finalAngle int

	// 2. OCR Check on specific angles
	if isSideways {
		fmt.Println("Geometry: Image is SIDEWAYS (Vertical lines dominate). Testing 90 vs 270...")
		// Only check 90 and 270
		score90 := getOCRScore(img, 90)
		score270 := getOCRScore(img, 270)

		if score90 > score270 {
			finalAngle = 90
		} else {
			finalAngle = 270
		}
	} else {
		fmt.Println("Geometry: Image is UPRIGHT (Horizontal lines dominate). Testing 0 vs 180...")
		// Only check 0 and 180
		score0 := getOCRScore(img, 0)
		score180 := getOCRScore(img, 180)

		// Note: Usually 0 is correct, but we check 180 just in case
		if score0 > score180 {
			finalAngle = 0
		} else {
			finalAngle = 180
		}
	}

	fmt.Printf(">> Final Decision: Rotate %d degrees\n", finalAngle)

	// 3. Apply Rotation
	if finalAngle != 0 {
		corrected := gocv.NewMat()
		defer corrected.Close()

		switch finalAngle {
		case 90:
			// If detected as 90 CW, we rotate 90 CCW to fix
			gocv.Rotate(img, &corrected, gocv.Rotate90Clockwise)
		case 180:
			gocv.Rotate(img, &corrected, gocv.Rotate180Clockwise)
		case 270:
			// If detected as 270 CW (Left), we rotate 90 CW to fix
			gocv.Rotate(img, &corrected, gocv.Rotate90CounterClockwise)
		}
		// gocv.IMWrite("fixed_rotation.bmp", corrected)
		return corrected.Clone()
	} else {
		// gocv.IMWrite("fixed_rotation.bmp", img)
		return img.Clone()
	}
}

func IsImageSideways(img gocv.Mat) bool {
	// Work on small copy
	small := gocv.NewMat()
	defer small.Close()
	scale := 1000.0 / float64(img.Cols())
	if scale > 1.0 {
		scale = 1.0
	}
	gocv.Resize(img, &small, image.Point{0, 0}, scale, scale, gocv.InterpolationLinear)

	gray := gocv.NewMat()
	defer gray.Close()
	gocv.CvtColor(small, &gray, gocv.ColorBGRToGray)

	edges := gocv.NewMat()
	defer edges.Close()
	gocv.Canny(gray, &edges, 50, 150)

	lines := gocv.NewMat()
	defer lines.Close()
	// Threshold 50, MinLen 50, MaxGap 10
	gocv.HoughLinesPWithParams(edges, &lines, 1, math.Pi/180, 50, 50, 10)

	var horizMass, vertMass float64

	for i := 0; i < lines.Rows(); i++ {
		v := lines.GetVeciAt(i, 0)
		x1, y1, x2, y2 := float64(v[0]), float64(v[1]), float64(v[2]), float64(v[3])

		dx := math.Abs(x2 - x1)
		dy := math.Abs(y2 - y1)
		length := math.Hypot(dx, dy)

		// Determine orientation of the line
		angle := math.Atan2(dy, dx) * 180 / math.Pi

		if angle < 45 || angle > 135 {
			horizMass += length
		} else {
			vertMass += length
		}
	}

	// Returns true if Vertical mass is significantly larger
	return vertMass > horizMass
}

// getOCRScore rotates the image and calculates a score based on valid words found
func getOCRScore(img gocv.Mat, angle int) float64 {
	testImg := gocv.NewMat()
	defer testImg.Close()

	scale := 1000.0 / float64(img.Cols())
	if scale > 1.0 {
		scale = 1.0
	}
	gocv.Resize(img, &testImg, image.Point{0, 0}, scale, scale, gocv.InterpolationLinear)

	rotated := gocv.NewMat()
	switch angle {
	case 0:
		rotated = testImg.Clone()
	case 90:
		gocv.Rotate(testImg, &rotated, gocv.Rotate90Clockwise)
	case 180:
		gocv.Rotate(testImg, &rotated, gocv.Rotate180Clockwise)
	case 270:
		gocv.Rotate(testImg, &rotated, gocv.Rotate90CounterClockwise)
	}

	client := gosseract.NewClient()
	defer client.Close()

	buf, _ := gocv.IMEncode(".jpg", rotated)
	imageBytes := buf.GetBytes()
	rotated.Close()
	buf.Close()

	client.SetImageFromBytes(imageBytes)
	client.SetPageSegMode(gosseract.PSM_AUTO) // Auto layout
	client.SetLanguage("rus", "eng")

	// Get Words with confidence
	boxes, err := client.GetBoundingBoxes(gosseract.RIL_WORD)
	if err != nil {
		return 0.0
	}

	totalScore := 0.0
	validWords := 0

	for _, box := range boxes {
		// CRITICAL FILTER:
		// 1. Confidence must be > 60
		// 2. Word must be at least 3 letters long.
		//    This filters out table lines detected as "1" or "I" or "|"
		if box.Confidence > 60 && len(box.Word) >= 3 {
			totalScore += box.Confidence
			validWords++
		}
	}

	// Final Score favors finding MANY valid words
	finalScore := totalScore * float64(validWords)

	fmt.Printf("Angle %d: Valid Words: %d | Score: %.0f\n", angle, validWords, finalScore)

	return finalScore
}

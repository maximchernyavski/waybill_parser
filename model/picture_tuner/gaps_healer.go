package PictureTuner

import (
	"image"

	"gocv.io/x/gocv"
)

func healGaps(img *gocv.Mat) { // 2. Prepare Binary Image (White Lines on Black Background)
	// Since your image is Black Text on White, we Invert it.
	inverted := gocv.NewMat()
	defer inverted.Close()
	gocv.BitwiseNot(*img, &inverted)

	// Clean up noise: pixels < 200 become 0, others 255.
	// This removes light gray scanner noise.
	binary := gocv.NewMat()
	defer binary.Close()
	gocv.Threshold(inverted, &binary, 235, 255, gocv.ThresholdBinary)

	// --- HORIZONTAL PROCESSING ---

	// Step A: "The Cut" - Remove Text
	// Kernel: 40px wide, 1px tall.
	// Any white blob narrower than 40px is deleted.
	horizKernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 40, Y: 1})
	defer horizKernel.Close()

	horizLines := gocv.NewMat()
	defer horizLines.Close()
	gocv.MorphologyEx(binary, &horizLines, gocv.MorphOpen, horizKernel)

	// Step B: "The Grow" - Heal Gaps
	// We dilate with the SAME kernel. This stretches every surviving line segment
	// by 20px left and right. Gaps smaller than 40px are bridged.
	gocv.Dilate(horizLines, &horizLines, horizKernel)

	// --- VERTICAL PROCESSING ---

	// Step A: "The Cut" - Remove Text
	// Kernel: 1px wide, 40px tall.
	vertKernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 1, Y: 40})
	defer vertKernel.Close()

	vertLines := gocv.NewMat()
	defer vertLines.Close()
	gocv.MorphologyEx(binary, &vertLines, gocv.MorphOpen, vertKernel)

	// Step B: "The Grow" - Heal Gaps
	// Stretches vertical lines up and down to bridge breaks.
	gocv.Dilate(vertLines, &vertLines, vertKernel)

	// -----------------------------

	// 3. Combine to create the Grid
	gridMask := gocv.NewMat()
	defer gridMask.Close()
	gocv.Add(horizLines, vertLines, &gridMask)

	// 4. Final Polish: Close Corners
	// Sometimes horizontal and vertical lines barely miss each other.
	// A tiny 3x3 dilate ensures they touch.
	polishKernel := gocv.GetStructuringElement(gocv.MorphRect, image.Point{X: 3, Y: 3})
	defer polishKernel.Close()
	gocv.Dilate(gridMask, &gridMask, polishKernel)

	// Debug: Save the grid to see if lines are solid
	// gocv.IMWrite("debug_solid_grid.bmp", gridMask)
}

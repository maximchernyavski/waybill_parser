package PictureParser

import (
	"fmt"
	"image"
	"image/color"
	"log"
	"math"
	"sort"

	"gocv.io/x/gocv"
)

func FindTable(imgPath string) {
	// 1. Load the deskewed image
	// Make sure this matches the output of your previous deskewing step
	src := gocv.IMRead(imgPath, gocv.IMReadColor)
	if src.Empty() {
		log.Fatalf("Could not read %s", imgPath)
	}
	defer src.Close()

	gridMask := gocv.IMRead("debug_solid_grid.bmp", gocv.IMReadGrayScale)
	if gridMask.Empty() {
		log.Fatalf("Could not read %s", imgPath)
	}
	defer gridMask.Close()

	// 6. Find Contours (The Table Cells)
	contours := gocv.FindContours(gridMask, gocv.RetrievalTree, gocv.ChainApproxSimple)
	defer contours.Close()

	var cells []image.Rectangle

	for i := 0; i < contours.Size(); i++ {
		cnt := contours.At(i)
		rect := gocv.BoundingRect(cnt)

		// Calculate Area
		area := rect.Dx() * rect.Dy()

		// Filter logic:
		// 1. Ignore tiny noise (area < 500)
		// 2. Ignore the "Table Frame" itself (which is often detected as a giant box surrounding everything)
		//    We check if the box is smaller than 90% of the page.
		if area > 500 && area < int(float64(src.Rows()*src.Cols())*0.9) {
			cells = append(cells, rect)
		}
	}

	// 7. Sort Cells (Top-to-Bottom, Left-to-Right)
	// This is required because contours are detected in random order.
	sortCells(cells)

	// 8. Visualization & Extraction Loop
	displayMat := src.Clone()
	defer displayMat.Close()

	fmt.Printf("Detected %d table cells.\n", len(cells))

	for i, rect := range cells {
		// Draw the detected cell in Green
		gocv.Rectangle(&displayMat, rect, color.RGBA{0, 255, 0, 0}, 2)

		// --- EXTRACT LOGIC START ---
		// Here is where you would crop the cell for Tesseract
		// roi := src.Region(rect)
		// Send 'roi' to Tesseract...
		// roi.Close()
		// --- EXTRACT LOGIC END ---

		fmt.Printf("Cell %d: Pos: (%d, %d) Size: %dx%d\n", i, rect.Min.X, rect.Min.Y, rect.Dx(), rect.Dy())
	}

	gocv.IMWrite("debug_detected_cells.bmp", displayMat)
}

func sortCells(cells []image.Rectangle) {
	sort.Slice(cells, func(i, j int) bool {
		// Define a "Row Height Tolerance".
		// If two cells are within 15 pixels of Y-alignment, consider them the same row.
		// Then sort by X.
		const rowTolerance = 15

		yDiff := math.Abs(float64(cells[i].Min.Y - cells[j].Min.Y))

		if yDiff < rowTolerance {
			// Same row -> Sort Left to Right
			return cells[i].Min.X < cells[j].Min.X
		}
		// Different row -> Sort Top to Bottom
		return cells[i].Min.Y < cells[j].Min.Y
	})
}

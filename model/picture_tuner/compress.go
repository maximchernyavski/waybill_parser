package PictureTuner

import (
	"image"
	"log"

	"gocv.io/x/gocv"
)

func CompressMat(mat *gocv.Mat, maxDim int) error {
	width := mat.Cols()
	height := mat.Rows()

	if width > maxDim || height > maxDim {
		var newW, newH int
		if width > height {
			newW = maxDim
			newH = (height * maxDim) / width
		} else {
			newH = maxDim
			newW = (width * maxDim) / height
		}

		err := gocv.Resize(*mat, mat, image.Point{X: newW, Y: newH}, 0, 0, gocv.InterpolationArea)
		if err != nil {
			log.Println("Can't resize image")
			return err
		}
	}

	return nil
}

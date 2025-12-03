package Misc

import (
	"image"
	"image/jpeg"
	"log"
)

type apiBuffer struct {
	bytes []byte
}

func (b *apiBuffer) Write(p []byte) (n int, err error) {
	b.bytes = append(b.bytes, p...)
	return len(p), nil
}

func ImgToBytes(img image.Image) []byte {
	// We write the image to a memory buffer in PNG format
	// var buf []byte
	// A simple buffer implementation
	buff := new(apiBuffer)
	// Encoding as PNG is lossless, good for OCR
	jpeg.Encode(buff, img, nil)
	return buff.bytes
}

func CropImage(img image.Image, x, y, w, h int) image.Image {
	// Determine the cropping rectangle
	rect := image.Rect(x, y, x+w, y+h)

	// Create a new sub-image.
	// Note: SubImage is efficient as it shares the underlying pixels.
	type subImager interface {
		SubImage(r image.Rectangle) image.Image
	}

	// Most standard Go images implement SubImage
	simg, ok := img.(subImager)
	if !ok {
		log.Fatal("Image type does not support cropping")
	}

	return simg.SubImage(rect)
}

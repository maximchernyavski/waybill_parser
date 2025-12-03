package main

import (
	PictureParser "waybil_parser/model/picture_parser"
	PictureTuner "waybil_parser/model/picture_tuner"
)

///Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые
//2554458
//0151009

func main() {
	// PictureParser.RecognizeRusEngText("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/0151009/0151009.jpg")
	PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/0151009/0151009_rotated.jpg")
	PictureParser.RecognizeMarkedPage("debug_processed.png")
}

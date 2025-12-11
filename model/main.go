package main

import (
	"log"
	"os"
	PictureParser "waybil_parser/model/picture_parser"
	PictureTuner "waybil_parser/model/picture_tuner"
)

///Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые
//2554458
//0151009

func main() {
	// PictureParser.RecognizeRusEngText("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/0151009/0151009.jpg")
	// "/Users/maksimchernyavski/Documents/GitHub/waybill_parser/model/final_deskewed.jpg"
	// "/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/4646616/4646616.jpg"
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/0151009/0151009_rotated.jpg")
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Читаемые/4646616/4646616.jpg")
	PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Desktop/КР ТиСПИС-2025/Сканы/Горизонтальные/0216538/02165380001.jpg")
	// PictureTuner.PrepareImprovedImage("/Users/maksimchernyavski/Documents/GitHub/waybill_parser/model/final_deskewed.jpg")
	// PictureParser.RecognizeMarkedPage("debug_processed.png")
	PictureParser.FindTable("final_deskewed.bmp")
	err := os.Remove("final_deskewed.bmp")
	if err != nil {
		log.Println("Can't delete file")
		log.Fatal(err)
	}
	err = os.Remove("debug_solid_grid.bmp")
	if err != nil {
		log.Println("Can't delete file")
		log.Fatal(err)
	}
	err = os.Remove("debug_detected_cells.bmp")
	if err != nil {
		log.Println("Can't delete file")
		log.Fatal(err)
	}
}

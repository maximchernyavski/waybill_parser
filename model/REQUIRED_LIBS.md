There are some libraries that are crucial for system to work and that won't be installed with go-packages. Those libraries are:


**1 OpenCV.**


**2 Tesseract (w eng and rus data).**


**3 Leptonica.**


**4 VTK (often w hdf5)** Sadly this dependency is produced by gocv and usage of manually written cgo parts will resolve this issue.
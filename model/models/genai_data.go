package Models

import (
	"mime/multipart"

	"google.golang.org/genai"
)

func FillGenaiParts(parts *[]*genai.Part, data *[]byte, header *multipart.FileHeader) {
	*parts = append(*parts, &genai.Part{
		InlineData: &genai.Blob{
			Data:     *data,
			MIMEType: header.Header.Get("Content-Type"),
		},
	})
}

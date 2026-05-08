package Models

type OllamaRequest struct {
	Model     string                 `json:"model"`
	Prompt    string                 `json:"prompt"`
	Format    string                 `json:"format"`
	Images    []string               `json:"images,omitempty"`
	Stream    bool                   `json:"stream"`
	KeepAlive int                    `json:"keep_alive"`
	Options   map[string]interface{} `json:"options,omitempty"`
}

type OllamaResponse struct {
	Model           string `json: "model"`
	CreatedAt       string `json: "created_at"`
	Response        string `json:"response"`
	Thinking        string `json: "thinking"`
	Done            bool   `json: "done"`
	PromptEvalCount int    `json:"prompt_eval_count"`
	EvalCount       int    `json:"eval_count"`
}

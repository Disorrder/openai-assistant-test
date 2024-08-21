package assistant

import (
	"api/db"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
)

func InitThreadsRoutes(router *gin.RouterGroup) {
	threadsGroup := router.Group("/threads")

	threadsGroup.POST("", createThreadHandler)
	threadsGroup.GET("", getThreadsHandler)
	threadsGroup.GET("/:id", getThreadHandler)
	threadsGroup.PATCH("/:id", updateThreadHandler)
	threadsGroup.GET("/:id/messages", getMessagesHandler)
	threadsGroup.POST("/:id/messages", sendMessageHandler)
}

func createThreadHandler(ctx *gin.Context) {
	username := ctx.GetString("username")

	aiThread, err := client.CreateThread(context.Background(), openai.ThreadRequest{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create thread"})
		return
	}

	thread := db.Thread{
		ID:       aiThread.ID,
		Username: username,
		Title:    "",
	}

	result := db.DB.Create(&thread)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save thread to database"})
		return
	}

	ctx.JSON(http.StatusOK, thread)
}

func getThreadsHandler(ctx *gin.Context) {
	username := ctx.GetString("username")

	var threads []db.Thread
	db.DB.Where("username = ?", username).Find(&threads)

	ctx.JSON(http.StatusOK, threads)
}

func getThreadHandler(ctx *gin.Context) {
	username := ctx.GetString("username")
	threadID := ctx.Param("id")

	var thread db.Thread
	db.DB.Where("id = ?", threadID).Where("username = ?", username).First(&thread)

	if thread.ID == "" {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return
	}

	ctx.JSON(http.StatusOK, thread)
}

func updateThreadHandler(ctx *gin.Context) {
	username := ctx.GetString("username")
	threadID := ctx.Param("id")

	var requestBody struct {
		Title string `json:"title"`
	}
	if err := ctx.BindJSON(&requestBody); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	title := requestBody.Title

	fmt.Println("Title received:", title)

	var thread db.Thread

	db.DB.Where("id = ?", threadID).Where("username = ?", username).First(&thread)
	if thread.ID == "" {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return
	}

	thread.Title = title

	result := db.DB.Model(&db.Thread{}).Where("id = ?", threadID).Save(&thread)
	if result.Error != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update thread"})
		return
	}

	ctx.JSON(http.StatusOK, thread)
}

func getMessagesHandler(ctx *gin.Context) {
	username := ctx.GetString("username")
	threadID := ctx.Param("id")

	var thread db.Thread
	db.DB.Where("id = ?", threadID).Where("username = ?", username).First(&thread)

	if thread.ID == "" {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return
	}

	messages, err := client.ListMessage(context.Background(), threadID, nil, nil, nil, nil)
	if err != nil {
		fmt.Printf("Failed to retrieve messages: %s", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
		return
	}

	ctx.JSON(http.StatusOK, messages)
}

func sendMessageHandler(ctx *gin.Context) {
	threadID := ctx.Param("id")

	var requestBody struct {
		Input string `json:"input"`
	}

	ctx.BindJSON(&requestBody)

	message := sendMessage(ctx, threadID, requestBody.Input)

	ctx.JSON(http.StatusOK, message)
}

func sendMessage(ctx *gin.Context, threadID string, messageStr string) *openai.Message {
	username := ctx.GetString("username")

	fmt.Println("Message received:", messageStr, "Thread ID:", threadID)

	if messageStr == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Message is required"})
		return nil
	}

	var thread db.Thread
	db.DB.Where("id = ?", threadID).Where("username = ?", username).First(&thread)

	if thread.ID == "" {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Thread not found"})
		return nil
	}

	fmt.Println("Thread found:", thread)

	// Create a message in the thread
	message, err := client.CreateMessage(context.Background(), threadID, openai.MessageRequest{
		Role:    "user",
		Content: messageStr,
	})
	if err != nil {
		fmt.Printf("Failed to send message: %s\n", err.Error())
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return nil
	}

	fmt.Printf("Message created: %+v\n", fmtJson(message))

	// Run the assistant
	run, err := client.CreateRun(context.Background(), threadID, openai.RunRequest{
		AssistantID: assistantID,
	})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create run"})
		return nil
	}

	fmt.Printf("Run created: %+v\n", fmtJson(run))

	// // Set up Server-Sent Events
	// ctx.Writer.Header().Set("Content-Type", "text/event-stream")
	// ctx.Writer.Header().Set("Cache-Control", "no-cache")
	// ctx.Writer.Header().Set("Connection", "keep-alive")

	// Update the run status and stream the response
	for {
		runStatus, err := client.RetrieveRun(context.Background(), threadID, run.ID)
		if err != nil {
			fmt.Printf("Failed to retrieve run status: %s", err.Error())
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve run status"})
			return nil
		}

		fmt.Printf("Run status: %+v\n", runStatus.Status)

		if runStatus.Status == "failed" {
			fmt.Printf("Run failed: %s", runStatus.Status)
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Run failed"})
			return nil
		}

		if runStatus.Status == "completed" {
			limit := 2 // just for debugging
			messages, err := client.ListMessage(context.Background(), threadID, &limit, nil, nil, nil)
			if err != nil {
				fmt.Printf("Failed to retrieve messages: %s", err.Error())
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve messages"})
				return nil
			}

			fmt.Printf("Messages: %+v\n", fmtJson(messages))

			// Send the last message (assistant's response)
			if len(messages.Messages) == 0 {
				return nil
			}

			return &messages.Messages[0]
		}

		// Wait for a short duration before checking again
		time.Sleep(500 * time.Millisecond)
	}
}

func fmtJson(data any) string {
	formatted, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return ""
	}
	return string(formatted)
}

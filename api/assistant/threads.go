package assistant

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sashabaranov/go-openai"
)

func InitThreadsRoutes(router *gin.RouterGroup) {
	threadsGroup := router.Group("/threads")

	threadsGroup.POST("", createThreadHandler)
	threadsGroup.GET("/last", getLastThreadHandler)
}

func createThreadHandler(ctx *gin.Context) {
	thread, err := client.CreateThread(context.Background(), openai.ThreadRequest{})
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create thread"})
		return
	}

	threadID := thread.ID
	ctx.JSON(http.StatusOK, gin.H{"thread_id": threadID})
}

func getLastThreadHandler(ctx *gin.Context) {

}

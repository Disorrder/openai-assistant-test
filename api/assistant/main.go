package assistant

import (
	"api/auth"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/sashabaranov/go-openai"
)

var openaiSecretKey string
var assistantID string
var client *openai.Client

func init() {
	godotenv.Load("../.env")

	openaiSecretKey = os.Getenv("OPENAI_SECRET")
	if len(openaiSecretKey) == 0 {
		panic("OPENAI_SECRET is not set in the environment")
	}
	assistantID = os.Getenv("OPENAI_ASSISTANT_ID")
	if len(assistantID) == 0 {
		panic("OPENAI_ASSISTANT_ID is not set in the environment")
	}

	client = openai.NewClient(openaiSecretKey)
}

func InitRoutes(router *gin.RouterGroup) {
	group := router.Group("/assistant")
	group.Use(auth.JWTAuthMiddleware())
	InitThreadsRoutes(group)
}

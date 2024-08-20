package main

import (
	"api/assistant"
	"api/auth"
	"api/db"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../.env")

	db.Init()

	router := gin.Default()

	config := cors.DefaultConfig()
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	// Allow all localhost ports and the specified CLIENT_ORIGIN
	config.AllowOriginFunc = func(origin string) bool {
		return strings.HasPrefix(origin, "http://localhost:") ||
			strings.HasPrefix(origin, "https://localhost:") ||
			origin == os.Getenv("CLIENT_ORIGIN")
	}
	router.Use(cors.New(config))

	api := router.Group("/api")
	api.GET("/hello", helloHandler)

	auth.InitRoutes(api)
	assistant.InitRoutes(api)

	router.Run(":8080")
}

func helloHandler(ctx *gin.Context) {
	type Message struct {
		Text string `json:"text"`
	}

	message := Message{Text: "Hello from the AI assistant!"}
	ctx.JSON(http.StatusOK, message)
}

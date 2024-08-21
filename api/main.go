package main

import (
	"api/assistant"
	"api/auth"
	"api/db"
	"api/middlewares"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load("../.env")

	db.Init()

	router := gin.Default()
	router.Use(middlewares.CORS())

	api := router.Group("/v1")
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

package middlewares

import (
	"os"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	config := cors.DefaultConfig()
	config.AllowCredentials = true
	config.AllowHeaders = append(config.AllowHeaders, "Authorization")
	// Allow all localhost ports and the specified CLIENT_ORIGIN
	config.AllowOriginFunc = func(origin string) bool {
		return strings.HasPrefix(origin, "http://localhost:") ||
			strings.HasPrefix(origin, "https://localhost:") ||
			origin == os.Getenv("CLIENT_ORIGIN")
	}

	return cors.New(config)
}

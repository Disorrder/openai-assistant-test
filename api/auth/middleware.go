package auth

import (
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func JWTAuthMiddleware() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		authHeader := ctx.GetHeader("Authorization")
		if authHeader == "" {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			ctx.Abort()
			return
		}

		bearerToken := strings.Split(authHeader, " ")
		if len(bearerToken) != 2 || strings.ToLower(bearerToken[0]) != "bearer" {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization header format"})
			ctx.Abort()
			return
		}

		tokenString := bearerToken[1]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			fmt.Println("Signing method:", jwtSecretKey, string(jwtSecretKey))
			return jwtSecretKey, nil
		})

		if err != nil {
			fmt.Println("Error parsing token:", err, tokenString, token)
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			ctx.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			if claims["type"] != "access" {
				ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
				ctx.Abort()
				return
			}
			ctx.Set("username", claims["username"])
			ctx.Next()
		} else {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			ctx.Abort()
			return
		}
	}
}

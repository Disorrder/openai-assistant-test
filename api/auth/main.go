package auth

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
)

var jwtSecretKey []byte

const (
	sidCookieName = "session_id"
	sidLength     = 32        // Length of the random bytes for SID
	cookieMaxAge  = 3600 * 24 // 24 hours
)

type TokenData struct {
	Username string `json:"username"`
}

type JWTPayload struct {
	TokenData
	Type string `json:"type"`
	Exp  int64  `json:"exp"`
}

func init() {
	godotenv.Load("../.env")

	jwtSecretKey = []byte(os.Getenv("JWT_SECRET_KEY"))
	if len(jwtSecretKey) == 0 {
		panic("JWT_SECRET_KEY is not set in the environment")
	}
}

func InitRoutes(router *gin.RouterGroup) {
	group := router.Group("/auth")
	group.POST("/sign-in", signInHandler)
	// group.POST("/sign-out", signOutHandler)
	group.POST("/refresh", refreshHandler)
}

func signInHandler(ctx *gin.Context) {
	// Get username from body
	// Return JWT Tokens

	var request struct {
		Username string `json:"username" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Generate JWT tokens
	data := TokenData{Username: request.Username}
	accessToken, refreshToken, err := generateJWTPair(data)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.SetCookie(
		"refresh_token",
		refreshToken,
		cookieMaxAge,
		"/",
		"",
		false,
		true,
	)

	ctx.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
	})
}

func refreshHandler(ctx *gin.Context) {
	refreshToken, err := ctx.Cookie("refresh_token")
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token not found"})
		return
	}

	// Parse and validate the refresh token
	token, err := jwt.Parse(refreshToken, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return jwtSecretKey, nil
	})

	if err != nil || !token.Valid {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse claims"})
		return
	}

	// Check if the token type is refresh
	if claims["type"] != "refresh" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token type"})
		return
	}

	// Generate new tokens
	username, ok := claims["username"].(string)
	if !ok {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse username"})
		return
	}

	data := TokenData{Username: username}
	newAccessToken, newRefreshToken, err := generateJWTPair(data)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate JWT tokens"})
		return
	}

	// Set the new refresh token as a cookie
	ctx.SetCookie(
		"refresh_token",
		newRefreshToken,
		cookieMaxAge,
		"/",
		"",
		false,
		true,
	)

	// Return the new access token
	ctx.JSON(http.StatusOK, gin.H{
		"access_token": newAccessToken,
	})
}

/* Utils*/

func generateJWTToken(data TokenData, tokenType string, expirationTime time.Duration) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": data.Username,
		"type":     tokenType,
		"exp":      time.Now().Add(expirationTime).Unix(),
	})

	return token.SignedString(jwtSecretKey)
}

func generateJWTPair(data TokenData) (string, string, error) {
	accessToken, err := generateJWTToken(data, "access", time.Hour)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %v", err)
	}

	refreshToken, err := generateJWTToken(data, "refresh", time.Hour*24*7)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %v", err)
	}

	return accessToken, refreshToken, nil
}

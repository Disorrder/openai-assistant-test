package db

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

type Thread struct {
	gorm.Model
	ID       string `json:"id"`
	Username string `json:"username"`
	Title    string `json:"title"`
}

func Init() {
	var err error
	DB, err = gorm.Open(sqlite.Open("test.db"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}

	// Auto Migrate your models here
	DB.AutoMigrate(&Thread{})
}

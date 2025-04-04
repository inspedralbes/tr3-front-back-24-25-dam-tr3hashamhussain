module.exports = {
    apps: [
        
      {
        name: "auth-service",
        script: "./microservices/auth-service/index.js",
        watch: true,
        env: {
          NODE_ENV: "development",
          // Sobrescribe variables si es necesario
          PORT: 3100
        },
        log_date_format: "YYYY-MM-DD HH:mm:ss"
      },
      {
        name: "image-service",
        script: "./microservices/image-service/index.js",
        watch: true,
        env: {
          NODE_ENV: "development",
          PORT: 3200
        },
        log_date_format: "YYYY-MM-DD HH:mm:ss"
      },
      {
        name: "stats-service",
        script: "./microservices/stats-service/index.js",
        watch: true,
        env: {
          NODE_ENV: "development",
          PORT: 3300
        },
        log_date_format: "YYYY-MM-DD HH:mm:ss"
      },
      {
        name: "game-service",
        script: "./microservices/game-service/index.js",
        watch: true,
        env: {
          NODE_ENV: "development",
          PORT: 3400
        },
        log_date_format: "YYYY-MM-DD HH:mm:ss"
      }
    ]
  };
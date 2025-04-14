module.exports = {
    apps: [{
      name: "msg-service",
      script: "messages-service/bin/www",
      env: {
        PORT:8081,
        NODE_ENV:"production"
      }
    }]
  }
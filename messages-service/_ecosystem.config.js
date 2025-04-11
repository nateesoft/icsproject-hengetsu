module.exports = {
    apps: [{
      name: "msg-service1",
      script: "messages-service/bin/www",
      env: {
        PORT:8081,
        NODE_ENV:"production"
      }
    },
    {
      name: "msg-service2",
      script: "messages-service/bin/www",
      env: {
        PORT:8082,
        NODE_ENV:"production"
      }
    },
    {
      name: "msg-service3",
      script: "messages-service/bin/www",
      env: {
        PORT:8083,
        NODE_ENV:"production"
      }
    }]
  }
module.exports = {
    apps: [{
      name: "msg-service0",
      script: "bin/www",
      env: {
        PORT:8080,
        NODE_ENV:"production"
      }
    },
    {
      name: "msg-service1",
      script: "bin/www",
      env: {
        PORT:8081,
        NODE_ENV:"production"
      }
    },
    {
      name: "msg-service2",
      script: "bin/www",
      env: {
        PORT:8082,
        NODE_ENV:"production"
      }
    },
    {
      name: "msg-service3",
      script: "bin/www",
      env: {
        PORT:8083,
        NODE_ENV:"production"
      }
    }]
  }
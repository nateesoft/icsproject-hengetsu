module.exports = {
    apps: [{
      name: "pos-app0",
      script: "server.js",
      env: {
        WEB_PORT:3000,
        SERVICE_HOST:"http://127.0.0.1:9090/api",
        WEB_FOLDER:"webapp"
      }
    },
    {
      name: "pos-app1",
      script: "server.js",
      env: {
        WEB_PORT:3000,
        SERVICE_HOST:"http://127.0.0.1:9091/api",
        WEB_FOLDER:"webapp"
      }
    },
    {
      name: "pos-app2",
      script: "server.js",
      env: {
        WEB_PORT:3000,
        SERVICE_HOST:"http://127.0.0.1:9092/api",
        WEB_FOLDER:"webapp"
      }
    },
    {
      name: "pos-app3",
      script: "server.js",
      env: {
        WEB_PORT:3000,
        SERVICE_HOST:"http://127.0.0.1:9093/api",
        WEB_FOLDER:"webapp"
      }
    }]
  }
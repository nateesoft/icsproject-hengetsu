module.exports = {
    apps: [{
      name: "pos-app",
      script: "pos-restaurant/server/server.js",
      env: {
        WEB_PORT:3000,
        SERVICE_HOST:"http://127.0.0.1:9091/api",
        WEB_FOLDER:"webapp"
      }
    },
    {
      name: "pos-app1",
      script: "pos-restaurant/server/server.js",
      env: {
        WEB_PORT:3001,
        SERVICE_HOST:"http://127.0.0.1:9091/api",
        WEB_FOLDER:"webapp1"
      }
    },
    {
      name: "pos-app2",
      script: "pos-restaurant/server/server.js",
      env: {
        WEB_PORT:3002,
        SERVICE_HOST:"http://127.0.0.1:9092/api",
        WEB_FOLDER:"webapp2"
      }
    },
    {
      name: "pos-app3",
      script: "pos-restaurant/server/server.js",
      env: {
        WEB_PORT:3003,
        SERVICE_HOST:"http://127.0.0.1:9093/api",
        WEB_FOLDER:"webapp3"
      }
    }]
  }
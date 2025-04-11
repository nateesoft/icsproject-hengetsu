module.exports = {
  apps: [{
    name: "desktop-app",
    script: "pos-restaurant/server/server.js",
    env: {
      WEB_PORT:3000,
      SERVICE_HOST:"http://127.0.0.1:9091/api",
      WEB_FOLDER:"desktop-app"
    }
  },
  {
    name: "tablet-1",
    script: "pos-restaurant/server/server.js",
    env: {
      WEB_PORT:3001,
      SERVICE_HOST:"http://127.0.0.1:9091/api",
      WEB_FOLDER:"tablet-1"
    }
  },
  {
    name: "tablet-2",
    script: "pos-restaurant/server/server.js",
    env: {
      WEB_PORT:3002,
      SERVICE_HOST:"http://127.0.0.1:9092/api",
      WEB_FOLDER:"tablet-2"
    }
  },
  {
    name: "tablet-3",
    script: "pos-restaurant/server/server.js",
    env: {
      WEB_PORT:3003,
      SERVICE_HOST:"http://127.0.0.1:9093/api",
      WEB_FOLDER:"tablet-3"
    }
  }]
}

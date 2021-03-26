module.exports = {
  apps : [{
    name: "server",
    script: "dos.js",
    instances: "max",
    exec_mode : "cluster",
    env: {
      NODE_ENV: "development",
    },
    env_production: {
      NODE_ENV: "production",
    }
  }]
}

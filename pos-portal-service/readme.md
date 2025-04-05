docker run --name mysql888 -p 3306:3306 -e MYSQL_ROOT_PASSWORD=nathee2024 -d mysql
https://www.npmjs.com/package/node-thermal-printer

# support mysql8^ to remote access
CREATE USER 'root'@'%' IDENTIFIED BY 'nathee2024';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%';

# start server
node --env-file=.env.app01 server.js
node --env-file=.env.app02 server.js
node --env-file=.env.app03 server.js

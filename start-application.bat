@echo off

pm2 start pos-portal-service/ecosystem.config.js
pm2 start messages-service/ecosystem.config.js
pm2 start pos-restaurant/server/ecosystem.config.js

java -jar sync-thermal-service/branch0/dist/sync-thermal-service.jar
java -jar sync-thermal-service/branch1/dist/sync-thermal-service.jar
java -jar sync-thermal-service/branch2/dist/sync-thermal-service.jar
java -jar sync-thermal-service/branch3/dist/sync-thermal-service.jar


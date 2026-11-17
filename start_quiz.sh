#!/bin/bash

echo "========================================" | lolcat
echo "     Iniciando aplicación |" | lolcat
echo "========================================" | lolcat

pm2 start npm --name "quiz-app" -- start -- -p 8032

sleep 2

pm2 status

echo "========================================" | lolcat
echo " Aplicación iniciada funcionando en PORT 8032 |" | lolcat
echo "========================================" | lolcat

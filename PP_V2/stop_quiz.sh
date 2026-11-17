#!/bin/bash

echo "========================================" | lolcat
echo "       Deteniendo aplicacion |" | lolcat
echo "========================================" | lolcat

pm2 stop quiz-app

echo ""
pm2 status

echo ""
read -p "¿Desea eliminar quiz-app de PM2? (s/n): " respuesta

if [[ "$respuesta" =~ ^[sS]$ ]]; then
    pm2 delete quiz-app

    echo ""
    echo "aplicacion eliminada de PM2 |" | lolcat
else
    echo ""
    echo "aplicacion detenida y mantenida en PM2 |" | lolcat
fi

echo ""
echo "========================================" | lolcat
pm2 status
echo "========================================" | lolcat

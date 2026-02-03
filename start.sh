#!/bin/bash

echo "🚀 Iniciando Gemini Vision Chat con Historial de Imágenes..."
echo ""

# Verificar si el servidor ya está corriendo
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "✅ Servidor backend ya está corriendo en puerto 3001"
else
    echo "🔄 Iniciando servidor backend..."
    node server.js &
    SERVER_PID=$!
    
    # Esperar a que el servidor esté listo
    sleep 2
    
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo "✅ Servidor backend iniciado en http://localhost:3001"
    else
        echo "❌ Error al iniciar el servidor backend"
        exit 1
    fi
fi

echo ""
echo "🔄 Iniciando frontend Vite..."
echo ""

# Iniciar Vite
vite

# Cuando se cierre Vite, también cerrar el servidor (opcional)
# kill $SERVER_PID 2>/dev/null
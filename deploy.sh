#!/bin/bash

# --- Script de Desplegament UXIA ---
# Aquest script automatitza l'actualització del servidor.

# Colorins per a la terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> 1. Baixant canvis de Git...${NC}"
git pull origin pro

echo -e "${BLUE}>>> 2. Construint el Frontend (React)...${NC}"
cd myprojectUxia/react
npm run build
cd ../..

echo -e "${BLUE}>>> 3. Actualitzant dependències (Python)...${NC}"
./uxia_virtual/bin/pip install -r myprojectUxia/requirements.txt

echo -e "${BLUE}>>> 4. Aplicant migracions de Base de Dades...${NC}"
# Utilitzem el python de l'entorn virtual directament
./uxia_virtual/bin/pip install -r requirements.txt
./uxia_virtual/bin/python3 myprojectUxia/manage.py migrate

echo -e "${BLUE}>>> 4. Recarregant el servidor Apache...${NC}"
sudo systemctl reload apache2

echo -e "${GREEN}✔ DESPLEGAMENT COMPLETAT AMB ÈXIT!${NC}"

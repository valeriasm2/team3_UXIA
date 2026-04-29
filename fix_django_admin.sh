#!/bin/bash

echo "🔧 Arreglant Django Admin..."

cd /home/super/team3_UXIA/myprojectUxia

# 1. Permisos correctes
echo "📁 Ajustant permisos..."
sudo chown www-data:www-data db.sqlite3
sudo chmod 664 db.sqlite3
sudo chown www-data:www-data /home/super/team3_UXIA/myprojectUxia
sudo chmod 775 /home/super/team3_UXIA/myprojectUxia
sudo chown -R www-data:www-data logs
sudo chmod -R 775 logs
sudo chown -R www-data:www-data media
sudo chmod -R 775 media

# 2. Col·lectar fitxers estàtics
echo "📦 Col·lectant fitxers estàtics..."
source ../uxia_virtual/bin/activate
python manage.py collectstatic --noinput --clear

# 3. Permisos de static
echo "🔒 Ajustant permisos de static..."
sudo chmod -R 755 static

# 4. Recarregar Apache
echo "🔄 Recargant Apache..."
sudo systemctl reload apache2

echo "✅ Fet!"
echo ""
echo "Prova Django Admin a: https://uxiaweb3.ieti.site/django-admin/"

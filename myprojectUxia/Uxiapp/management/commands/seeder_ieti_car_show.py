import os
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from datetime import date
from Uxiapp.models import Expo, Item, Imatge

class Command(BaseCommand):
    help = 'Borra y regenera la Expo para actualizar nombres de imágenes'

    def handle(self, *args, **options):
        # 1. LIMPIEZA TOTAL
        # Al borrar la Expo, el CASCADE borra Items e Imatges automáticamente.
        self.stdout.write(self.style.WARNING('Borrando Expo "IETI CAR SHOW" y sus Items e Imatges...'))
        Expo.objects.filter(nombre="IETI CAR SHOW").delete()

        ruta_base = os.path.join(settings.BASE_DIR, 'temp_fotos')

        # 2. CREAR EXPO DE NUEVO
        expo = Expo.objects.create(
            nombre="IETI CAR SHOW",
            fecha_inicio=date(2026, 4, 15),
            fecha_fin=date(2026, 5, 20),
            lugar="Campus IETI",
            descripcion="Colección actualizada con nuevos nombres de archivo.",
            estado=Expo.Estado.DISPONIBLE,
        )

        if not os.path.exists(ruta_base):
            self.stdout.write(self.style.ERROR('No se encuentra temp_fotos'))
            return

        # 3. PROCESAR CARPETAS (ignorar random_fotos)
        for nombre_coche in os.listdir(ruta_base):
            ruta_coche = os.path.join(ruta_base, nombre_coche)
            if os.path.isdir(ruta_coche) and nombre_coche != 'random_fotos':
                
                fotos = [f for f in os.listdir(ruta_coche) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
                if not fotos:
                    continue

                # Crear Item
                item = Item.objects.create(
                    nombre=nombre_coche.capitalize(),
                    expo=expo,
                    descripcion=f"Coche de la marca {nombre_coche}"
                )

                # 4. CARGAR GALERÍA (Imatges)
                es_primera = True
                for foto in fotos:
                    with open(os.path.join(ruta_coche, foto), 'rb') as f:
                        nueva_img = Imatge(item=item, es_destacada=es_primera)
                        # Aquí es donde se guarda el nuevo nombre en la DB
                        nueva_img.imagen.save(foto, File(f), save=True)
                        es_primera = False
                
                # Imagen de portada para la Expo
                if not expo.imagen:
                    with open(os.path.join(ruta_coche, fotos[0]), 'rb') as f:
                        expo.imagen.save(fotos[0], File(f), save=True)

        self.stdout.write(self.style.SUCCESS('¡Hecho! Expo "IETI CAR SHOW" ejecutada.'))
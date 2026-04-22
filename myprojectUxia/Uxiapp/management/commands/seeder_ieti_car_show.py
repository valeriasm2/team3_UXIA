import os
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from datetime import date
from Uxiapp.models import Expo, Item, Imatge, Etiqueta

class Command(BaseCommand):
    help = 'Borra y regenera la Expo para actualizar nombres de imágenes'

    def handle(self, *args, **options):
        # 1. LIMPIEZA TOTAL
        # Al borrar la Expo, el CASCADE borra Items e Imatges automáticamente.
        self.stdout.write(self.style.WARNING('Borrando Expo "IETI CAR SHOW" y sus Items e Imatges...'))
        Expo.objects.filter(nom="IETI CAR SHOW").delete()

        ruta_base = os.path.join(settings.BASE_DIR, 'temp_fotos')

        # 2. CREAR EXPO DE NUEVO
        expo = Expo.objects.create(
            nom="IETI CAR SHOW",
            data_inici=date(2026, 4, 15),
            data_fi=date(2026, 5, 20),
            lloc="Campus IETI",
            descripcio="Colección actualizada con nuevos nombres de archivo.",
            estat=Expo.Estat.DISPONIBLE,
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
                    nom=nombre_coche.capitalize(),
                    expo=expo,
                    descripcio=f"Coche de la marca {nombre_coche}"
                )

                # Generar y asignar Etiquetas
                import random
                etiqueta_marca, _ = Etiqueta.objects.get_or_create(nom="Marques")
                etiqueta_tipus, _ = Etiqueta.objects.get_or_create(nom="Tipus de Vehicle")
                
                tag_marca, _ = Etiqueta.objects.get_or_create(nom=nombre_coche.capitalize(), pare=etiqueta_marca)
                item.etiquetes.add(tag_marca)
                
                tipus_possibles = ["Compacte", "Sedan", "SUV", "Coupé", "Esportiu", "Familiar", "Cabrio"]
                tag_tipus, _ = Etiqueta.objects.get_or_create(nom=random.choice(tipus_possibles), pare=etiqueta_tipus)
                item.etiquetes.add(tag_tipus)

                # 4. CARGAR GALERÍA (Imatges)
                es_primera = True
                for foto in fotos:
                    with open(os.path.join(ruta_coche, foto), 'rb') as f:
                        nueva_img = Imatge(item=item, es_destacada=es_primera)
                        # Aquí es donde se guarda el nuevo nombre en la DB
                        nueva_img.imatge.save(foto, File(f), save=True)
                        es_primera = False
                
                # Imagen de portada para la Expo
                if not expo.imatge:
                    with open(os.path.join(ruta_coche, fotos[0]), 'rb') as f:
                        expo.imatge.save(fotos[0], File(f), save=True)

        self.stdout.write(self.style.SUCCESS('¡Hecho! Expo "IETI CAR SHOW" ejecutada.'))
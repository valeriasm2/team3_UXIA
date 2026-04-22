import os
import random
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from datetime import date, timedelta
from faker import Faker
from Uxiapp.models import Expo, Item, Imatge, Etiqueta

class Command(BaseCommand):
    help = 'Genera Expos aleatorias con Faker y asigna imágenes aleatoriamente'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=1, help='Número de expos a generar')

    def handle(self, *args, **options):
        count = options['count']
        fake = Faker(['es_ES'])
        
        for _ in range(count):
            # 1. GENERAR NOMBRE DE EXPO ALEATORIO
            ciudad = fake.city()
            tipos_evento = ["Car Show", "Expo Automóvil", "Salón del Automóvil", "Mega Car Fest", "Auto Expo"]
            tipo = random.choice(tipos_evento)
            nombre_expo = f"{ciudad} {tipo}"
            
            self.stdout.write(self.style.SUCCESS(f'Creando Expo: {nombre_expo}'))
            
            # 2. CREAR EXPO
            fecha_inicio = date.today() + timedelta(days=random.randint(1, 30))
            fecha_fin = fecha_inicio + timedelta(days=random.randint(5, 15))
            
            expo = Expo.objects.create(
                nom=nombre_expo,
                data_inici=fecha_inicio,
                data_fi=fecha_fin,
                lloc=f"Recinto {fake.street_name()}, {ciudad}",
                descripcio=f"Exposición de vehículos en {ciudad}. Ven a descubrir los últimos modelos.",
                estat=Expo.Estat.DISPONIBLE,
            )
            
            # 3. OBTENER CATÁLOGO DE IMÁGENES DE RANDOM_FOTOS
            ruta_base = os.path.join(settings.BASE_DIR, 'temp_fotos')
            ruta_random = os.path.join(ruta_base, 'random_fotos')
            catalogo_fotos = []
            
            if os.path.exists(ruta_random):
                fotos = [f for f in os.listdir(ruta_random) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
                for foto in fotos:
                    catalogo_fotos.append(('random_fotos', foto))
            
            if not catalogo_fotos:
                self.stdout.write(self.style.ERROR('No se encontraron imágenes en temp_fotos'))
                continue
            
            # 4. GENERAR ITEMS CON NOMBRES DE COCHES REALISTAS
            marcas = ["Volkswagen", "Ford", "Seat", "Opel", "Chevrolet", "Tesla", "BMW", "Mercedes", "Audi", "Toyota", "Honda", "Hyundai", "Kia"]
            modelos = ["Sedán", "Coup", "SUV", "Hatchback", "Familiar", "Crossover", "Convertible", "Monovolumen"]
            años = [2020, 2021, 2022, 2023, 2024, 2025]
            
            num_items = random.randint(12, 18)
            
            for i in range(num_items):
                marca = random.choice(marcas)
                modelo = random.choice(modelos)
                año = random.choice(años)
                
                nombre_item = f"{marca} {modelo} {año}"
                
                item = Item.objects.create(
                    nom=nombre_item,
                    expo=expo,
                    descripcio=f"{nombre_item} - {fake.sentence(nb_words=8)}"
                )
                
                # Generar y asignar Etiquetas
                etiqueta_marca, _ = Etiqueta.objects.get_or_create(nom="Marques")
                etiqueta_tipus, _ = Etiqueta.objects.get_or_create(nom="Tipus de Vehicle")
                tag_marca, _ = Etiqueta.objects.get_or_create(nom=marca, pare=etiqueta_marca)
                tag_tipus, _ = Etiqueta.objects.get_or_create(nom=modelo, pare=etiqueta_tipus)
                
                item.etiquetes.add(tag_marca)
                item.etiquetes.add(tag_tipus)
                
                # Asignar 2-4 imágenes aleatorias al item
                num_imagenes = random.randint(2, 4)
                fotos_seleccionadas = random.sample(catalogo_fotos, min(num_imagenes, len(catalogo_fotos)))
                
                es_primera = True
                for nombre_carpeta, nombre_foto in fotos_seleccionadas:
                    ruta_foto = os.path.join(ruta_base, nombre_carpeta, nombre_foto)
                    
                    try:
                        with open(ruta_foto, 'rb') as f:
                            nueva_img = Imatge(item=item, es_destacada=es_primera)
                            nueva_img.imatge.save(nombre_foto, File(f), save=True)
                            es_primera = False
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'Error al guardar {nombre_foto}: {e}'))
                
                # Asignar imagen de portada a la Expo si no la tiene
                if not expo.imatge and fotos_seleccionadas:
                    nombre_carpeta, nombre_foto = fotos_seleccionadas[0]
                    ruta_foto = os.path.join(ruta_base, nombre_carpeta, nombre_foto)
                    try:
                        with open(ruta_foto, 'rb') as f:
                            expo.imatge.save(nombre_foto, File(f), save=True)
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'Error al guardar imagen de Expo: {e}'))
            
            self.stdout.write(self.style.SUCCESS(f'¡Hecho! Expo "{nombre_expo}" creada con {num_items} items.'))

import os
import random
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from datetime import date, timedelta
from faker import Faker
from django.contrib.auth.models import User
from Uxiapp.models import Expo, Item, Imatge, Etiqueta

RUTA_FOTOS = os.path.join(settings.BASE_DIR, 'fotos_faker')
EXCLOURE = set()


def carpetes_cotxes():
    """Retorna llista de (nom_carpeta, nom_item, marca, model) per cada carpeta de cotxe."""
    resultat = []
    if not os.path.exists(RUTA_FOTOS):
        return resultat
    for carpeta in sorted(os.listdir(RUTA_FOTOS)):
        if carpeta in EXCLOURE:
            continue
        ruta = os.path.join(RUTA_FOTOS, carpeta)
        if not os.path.isdir(ruta):
            continue
        parts = carpeta.split('-')
        nom_item = ' '.join(parts)
        marca = parts[0] if parts else carpeta
        model = ' '.join(parts[1:]) if len(parts) > 1 else carpeta
        resultat.append((carpeta, nom_item, marca, model))
    return resultat


def fotos_de_carpeta(nom_carpeta):
    """Retorna llista de rutes d'imatge dins una carpeta de cotxe."""
    ruta = os.path.join(RUTA_FOTOS, nom_carpeta)
    extensions = ('.jpg', '.jpeg', '.png', '.webp')
    return [
        os.path.join(ruta, f)
        for f in os.listdir(ruta)
        if f.lower().endswith(extensions)
    ]


class Command(BaseCommand):
    help = 'Genera Expos amb els cotxes de temp_fotos assignant les fotos correctes a cada ítem'

    def add_arguments(self, parser):
        parser.add_argument('--count', type=int, default=1, help='Número d\'expos a generar')
        parser.add_argument('--max-fotos', type=int, default=10, help='Màxim de fotos per ítem')

    def handle(self, *args, **options):
        count = options['count']
        max_fotos = options['max_fotos']
        fake = Faker(['es_ES'])

        cotxes = carpetes_cotxes()
        if not cotxes:
            self.stdout.write(self.style.ERROR(
                f'No s\'han trobat carpetes de cotxes a {RUTA_FOTOS}'
            ))
            return

        self.stdout.write(self.style.SUCCESS(
            f'Cotxes disponibles: {[c[1] for c in cotxes]}'
        ))

        usuarios = list(User.objects.all())
        if not usuarios:
            admin_user, _ = User.objects.get_or_create(
                username='admin',
                defaults={'email': 'admin@uxia.local', 'is_staff': True, 'is_superuser': True}
            )
            usuarios = [admin_user]

        for n in range(count):
            ciudad = fake.city()
            tipus = random.choice(["Car Show", "Expo Automóvil", "Salón del Automóvil", "Mega Car Fest", "Auto Expo"])
            nom_expo = f"{ciudad} {tipus}"

            self.stdout.write(self.style.SUCCESS(f'\nCreant Expo [{n+1}/{count}]: {nom_expo}'))

            fecha_inicio = date.today() + timedelta(days=random.randint(1, 30))
            fecha_fin = fecha_inicio + timedelta(days=random.randint(5, 15))

            expo = Expo.objects.create(
                nom=nom_expo,
                data_inici=fecha_inicio,
                data_fi=fecha_fin,
                lloc=f"Recinto {fake.street_name()}, {ciudad}",
                descripcio=f"Exposición de vehículos en {ciudad}. Ven a descubrir los últimos modelos.",
                estat=Expo.Estat.DISPONIBLE,
                propietari=random.choice(usuarios),
            )

            # Si hi ha més cotxes que necessitem, fem una selecció aleatòria
            seleccio = random.sample(cotxes, min(len(cotxes), random.randint(len(cotxes), len(cotxes))))

            expo_imatge_posada = False

            for nom_carpeta, nom_item, marca, model in seleccio:
                fotos = fotos_de_carpeta(nom_carpeta)
                if not fotos:
                    self.stdout.write(self.style.WARNING(f'  Sense fotos: {nom_carpeta}'))
                    continue

                item = Item.objects.create(
                    nom=nom_item,
                    expo=expo,
                    descripcio=f"{nom_item} - {fake.sentence(nb_words=8)}"
                )

                # Etiquetes
                etiqueta_marca, _ = Etiqueta.objects.get_or_create(nom="Marques")
                etiqueta_tipus, _ = Etiqueta.objects.get_or_create(nom="Tipus de Vehicle")
                tag_marca, _ = Etiqueta.objects.get_or_create(nom=marca, pare=etiqueta_marca)
                tag_model, _ = Etiqueta.objects.get_or_create(nom=model, pare=etiqueta_tipus)
                item.etiquetes.add(tag_marca, tag_model)

                # Assignar fotos (totes o fins a max_fotos)
                fotos_seleccionades = random.sample(fotos, min(max_fotos, len(fotos)))

                for idx, ruta_foto in enumerate(fotos_seleccionades):
                    try:
                        with open(ruta_foto, 'rb') as f:
                            nova_img = Imatge(item=item, es_destacada=(idx == 0), es_publica=True, ordre=idx)
                            nova_img.imatge.save(os.path.basename(ruta_foto), File(f), save=True)
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'  Error foto {ruta_foto}: {e}'))

                # Primera foto del primer cotxe com a portada de l'expo
                if not expo_imatge_posada and fotos_seleccionades:
                    try:
                        with open(fotos_seleccionades[0], 'rb') as f:
                            expo.imatge.save(os.path.basename(fotos_seleccionades[0]), File(f), save=True)
                        expo_imatge_posada = True
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'  Error portada expo: {e}'))

                self.stdout.write(f'  + {nom_item} ({len(fotos_seleccionades)} fotos)')

            self.stdout.write(self.style.SUCCESS(
                f'Expo "{nom_expo}" creada amb {len(seleccio)} items.'
            ))

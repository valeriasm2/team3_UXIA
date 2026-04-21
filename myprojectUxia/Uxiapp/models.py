from django.db import models


class Expo(models.Model):

    class Estat(models.TextChoices):
        INIT = 'INIT', 'Inici'
        DISPONIBLE = 'DISPONIBLE', 'Disponible'
        ACTUALITZABLE = 'ACTUALITZABLE', 'Actualitzable'

    nom = models.CharField(max_length=100)
    data_inici = models.DateField()
    data_fi = models.DateField()
    lloc = models.CharField(max_length=100)
    descripcio = models.TextField()
    imatge = models.ImageField(upload_to='expos')

    estat = models.CharField(
        max_length=20,
        choices=Estat.choices,
        default=Estat.INIT
    )

    def __str__(self):
        return self.nom

class Item(models.Model):
    nom = models.CharField(max_length=100)
    descripcio = models.TextField()
    imatge = models.ImageField(upload_to='items')
    expo = models.ForeignKey(
        Expo,
        on_delete=models.CASCADE,
        related_name='items'
    )

    def __str__(self):
        return self.nom


class Imatge(models.Model):
    imatge = models.ImageField(upload_to='imatges')
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='imagenes'
    )
    es_publica = models.BooleanField(default=True)
    es_destacada = models.BooleanField(default=False, help_text="Marcar  perquè sigui la imatge de portada o destacada")

    def __str__(self):
        return f"Imatge de {self.item.nom}"

class Etiqueta(models.Model):
    nom = models.CharField(max_length=100)
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='etiquetas'
    )
    padre = models.ForeignKey(
        'Etiqueta',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='hijas'
    )

    def __str__(self):
        return self.nom


class Intents(models.Model):
    imatge = models.ImageField(upload_to='intents')
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='intentos'
    )

    def __str__(self):
        return f"Intent per a {self.item.nom}"



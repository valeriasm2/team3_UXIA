from django.db import models


class Expo(models.Model):

    class Estado(models.TextChoices):
        INIT = 'INIT', 'Init'
        DISPONIBLE = 'DISPONIBLE', 'Disponible'
        ACTUALITZABLE = 'ACTUALITZABLE', 'Actualitzable'

    nombre = models.CharField(max_length=100)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    lugar = models.CharField(max_length=100)
    descripcion = models.TextField()
    imagen = models.ImageField(upload_to='expos')

    estado = models.CharField(
        max_length=20,
        choices=Estado.choices,
        default=Estado.INIT
    )

    def __str__(self):
        return self.nombre

class Item(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    expo = models.ForeignKey(
        Expo,
        on_delete=models.CASCADE,
        related_name='items'
    )

    def __str__(self):
        return self.nombre


class Imatge(models.Model):
    imagen = models.ImageField(upload_to='imatges')
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='imagenes'
    )
    es_publica = models.BooleanField(default=True)
    es_destacada = models.BooleanField(default=False, help_text="Marcar  para que sea la imagen de portada o destacada")

    def __str__(self):
        return f"Imagen de {self.item.nombre}"

class Etiqueta(models.Model):
    nombre = models.CharField(max_length=100)
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
        return self.nombre


class Intents(models.Model):
    imagen = models.ImageField(upload_to='intents')
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='intentos'
    )

    def __str__(self):
        return f"Intento para {self.item.nombre}"



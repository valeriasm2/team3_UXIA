from django.db import models


# ─── Utilitats d'upload ────────────────────────────────────────────────────────

def expo_upload(instance, filename):
    return f"expos/{instance.pk or 'new'}/{filename}"


def item_upload(instance, filename):
    return f"items/{instance.pk or 'new'}/{filename}"


def imatge_upload(instance, filename):
    return f"imatges/{instance.item_id}/{filename}"


def intent_upload(instance, filename):
    return f"intents/{instance.item_id}/{filename}"


# ─── Etiqueta (tag) ────────────────────────────────────────────────────

class Etiqueta(models.Model):
    """
    Tag jeràrquic. Pot ser arrel (pare=None) o fill d'una altra etiqueta.
    Exemple: 'vehicles > cotxes > sedan'
    """
    nom = models.CharField(max_length=100, verbose_name="Nom")
    pare = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='filles',
        verbose_name="Etiqueta pare",
        help_text="Deixa en blanc si és una etiqueta arrel"
    )

    class Meta:
        verbose_name = "Etiqueta"
        verbose_name_plural = "Etiquetes"
        ordering = ['nom']

    def __str__(self):
        if self.pare:
            return f"{self.pare} › {self.nom}"
        return self.nom

    def full_path(self):
        """Retorna la ruta completa: arrel › pare › fill"""
        if self.pare:
            return f"{self.pare.full_path()} › {self.nom}"
        return self.nom


# ─── Expo ─────────────────────────────────────────────────────────────────────

class Expo(models.Model):
    """
    Exposició que agrupa un conjunt d'Items identificables per la IA.

    Estats:
      INIT          → Creada però encara no entrenada.
      DISPONIBLE    → IA entrenada i llesta per identificar.
      ACTUALITZABLE → Entrenada, però hi ha canvis pendents de re-entrenar.
    """

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
    creat_el = models.DateTimeField(auto_now_add=True)
    actualitzat_el = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Exposició"
        verbose_name_plural = "Exposicions"
        ordering = ['-data_inici']

    def __str__(self):
        return self.nom

class Item(models.Model):
    nom = models.CharField(max_length=100)
    descripcio = models.TextField()
    imatge = models.ImageField(upload_to='items')
    expo = models.ForeignKey(
        Expo,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Exposició"
    )
    imatge_destacada = models.ImageField(
        upload_to=item_upload,
        blank=True,
        null=True,
        verbose_name="Imatge destacada",
        help_text="Imatge principal de l'ítem, mostrada al llistat i la fitxa."
    )
    etiquetes = models.ManyToManyField(
        Etiqueta,
        blank=True,
        related_name='items',
        verbose_name="Etiquetes"
    )
    creat_el = models.DateTimeField(auto_now_add=True)
    actualitzat_el = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Ítem"
        verbose_name_plural = "Ítems"
        ordering = ['nom']

    def __str__(self):
        return self.nom


# ─── Imatge ───────────────────────────────────────────────────────────────────

class Imatge(models.Model):
    imatge = models.ImageField(upload_to='imatges')
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='imatges',
        verbose_name="Ítem"
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
        related_name='intents',
        verbose_name="Ítem identificat"
    )
    encert = models.BooleanField(
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



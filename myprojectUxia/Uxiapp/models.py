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
    """

    class Estat(models.TextChoices):
        INIT = 'INIT', 'Inici'
        DISPONIBLE = 'DISPONIBLE', 'Disponible'
        ACTUALITZABLE = 'ACTUALITZABLE', 'Actualitzable'

    nom = models.CharField(max_length=100, verbose_name="Nom")
    data_inici = models.DateField(verbose_name="Data d'inici")
    data_fi = models.DateField(verbose_name="Data de fi")
    lloc = models.CharField(max_length=100, verbose_name="Lloc")
    descripcio = models.TextField(verbose_name="Descripció")
    imatge = models.ImageField(upload_to=expo_upload, verbose_name="Imatge")

    estat = models.CharField(
        max_length=20,
        choices=Estat.choices,
        default=Estat.INIT,
        verbose_name="Estat"
    )
    creat_el = models.DateTimeField(auto_now_add=True)
    actualitzat_el = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Exposició"
        verbose_name_plural = "Exposicions"
        ordering = ['-data_inici']

    def __str__(self):
        return self.nom


# ─── Item ─────────────────────────────────────────────────────────────────────

class Item(models.Model):
    nom = models.CharField(max_length=100, verbose_name="Nom")
    descripcio = models.TextField(verbose_name="Descripció")
    expo = models.ForeignKey(
        Expo,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name="Exposició"
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
    imatge = models.ImageField(upload_to=imatge_upload, verbose_name="Arxiu d'imatge")
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='imatges',
        verbose_name="Ítem"
    )
    es_publica = models.BooleanField(
        default=True, 
        verbose_name="Pública",
        help_text="Pública: apta pel frontend."
    )
    es_destacada = models.BooleanField(
        default=False, 
        verbose_name="Destacada",
        help_text="Marcar perquè sigui la imatge de portada o destacada"
    )
    ordre = models.PositiveSmallIntegerField(default=0, verbose_name="Ordre")
    creat_el = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Imatge"
        verbose_name_plural = "Imatges"
        ordering = ['ordre', 'creat_el']

    def __str__(self):
        return f"Imatge de {self.item.nom}"


# ─── Intent ───────────────────────────────────────────────────────────────────

class Intent(models.Model):
    imatge = models.ImageField(upload_to=intent_upload, verbose_name="Foto enviada")
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='intents',
        verbose_name="Ítem identificat"
    )
    encert = models.BooleanField(
        null=True,
        blank=True,
        verbose_name="Encert",
        help_text="True=identificat correctament, False=incorrecte, Null=pendent de validar"
    )
    confiança = models.FloatField(
        null=True,
        blank=True,
        verbose_name="Confiança IA",
        help_text="Percentatge de confiança retornat pel model (0.0 – 1.0)"
    )
    creat_el = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Intent"
        verbose_name_plural = "Intents"
        ordering = ['-creat_el']

    def __str__(self):
        return f"Intent per a {self.item.nom}"

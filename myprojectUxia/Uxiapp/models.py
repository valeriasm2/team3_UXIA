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
        INIT = 'INIT', 'Init'
        DISPONIBLE = 'DISPONIBLE', 'Disponible'
        ACTUALITZABLE = 'ACTUALITZABLE', 'Actualitzable'

    nom = models.CharField(max_length=200, verbose_name="Nom")
    descripcio = models.TextField(blank=True, verbose_name="Descripció")
    lloc = models.CharField(max_length=200, verbose_name="Lloc")
    data_inici = models.DateField(verbose_name="Data d'inici")
    data_fi = models.DateField(verbose_name="Data de fi")
    imatge_portada = models.ImageField(
        upload_to=expo_upload,
        blank=True,
        null=True,
        verbose_name="Imatge de portada"
    )
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
        return f"{self.nom} ({self.get_estat_display()})"


# ─── Item ─────────────────────────────────────────────────────────────────────

class Item(models.Model):
    """
    Element identificable dins d'una Expo (p. ex. un cotxe, una obra d'art...).
    Té una imatge destacada pròpia i una galeria addicional via Imatge.
    """
    nom = models.CharField(max_length=200, verbose_name="Nom")
    descripcio = models.TextField(blank=True, verbose_name="Descripció")
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
        return f"{self.nom} [{self.expo.nom}]"


# ─── Imatge ───────────────────────────────────────────────────────────────────

class Imatge(models.Model):
    """
    Imatge de la galeria d'un Item.

    Visibilitat:
      es_publica=True  → Apta per mostrar al frontend.
      es_publica=False → Exclusiva per a entrenament de la IA (privada).
    """
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
        help_text="Pública: apta pel frontend. Privada: només per entrenar la IA."
    )
    ordre = models.PositiveSmallIntegerField(default=0, verbose_name="Ordre")
    creat_el = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Imatge"
        verbose_name_plural = "Imatges"
        ordering = ['ordre', 'creat_el']

    def __str__(self):
        visibilitat = "pública" if self.es_publica else "privada"
        return f"Imatge {visibilitat} de «{self.item.nom}»"


# ─── Intents ──────────────────────────────────────────────────────────────────

class Intent(models.Model):
    """
    Foto enviada per un usuari per a la identificació d'un Item via IA.
    """
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
        estat = "✓" if self.encert else ("✗" if self.encert is False else "?")
        return f"Intent {estat} per «{self.item.nom}»"

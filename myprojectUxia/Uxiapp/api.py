from ninja import NinjaAPI, ModelSchema, Schema, File, Form
from ninja.files import UploadedFile
from ninja.errors import HttpError
from typing import List, Optional
import base64
import requests
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User, Group
from rest_framework.authtoken.models import Token
from django.db import models
from .models import Expo, Item, Imatge, Etiqueta, Intent
from .ai_utils import process_intent

api = NinjaAPI(title="UXIA API", version="2.0")


# ─── Schemas ──────────────────────────────────────────────────────────────────

class LoginSchema(Schema):
    username: str
    password: str


class LoginResponseSchema(Schema):
    token: str
    user: str


class EtiquetaSchema(ModelSchema):
    class Meta:
        model = Etiqueta
        fields = ['id', 'nom', 'pare']


class ImatgeSchema(ModelSchema):
    class Meta:
        model = Imatge
        fields = ['id', 'imatge', 'es_publica', 'ordre', 'creat_el']


class IntentSchema(ModelSchema):
    class Meta:
        model = Intent
        fields = ['id', 'imatge', 'encert', 'confiança', 'creat_el']


class ItemSchema(ModelSchema):
    imatge: Optional[str] = None

    class Meta:
        model = Item
        exclude = ['etiquetes']

    @staticmethod
    def resolve_imatge(obj):
        first_img = obj.imatges.filter(es_publica=True).first()
        if first_img:
            return first_img.imatge.url
        return None


class ItemDetailSchema(ModelSchema):
    imatges: List[ImatgeSchema] = []
    intents: List[IntentSchema] = []
    etiquetes: List[EtiquetaSchema] = []

    class Meta:
        model = Item
        exclude = ['etiquetes']


class ExpoSchema(ModelSchema):
    class Meta:
        model = Expo
        fields = '__all__'


class UpdateExpoSchema(Schema):
    nom: Optional[str] = None
    lloc: Optional[str] = None
    descripcio: Optional[str] = None
    data_inici: Optional[str] = None
    data_fi: Optional[str] = None


class CreateItemSchema(Schema):
    nom: str
    descripcio: str
    expo_id: int
    etiquetes_ids: List[int] = []


class UpdateItemSchema(Schema):
    nom: str
    descripcio: str
    etiquetes_ids: List[int] = []


class ExpoDetailSchema(ModelSchema):
    items: List[ItemSchema] = []

    class Meta:
        model = Expo
        fields = '__all__'


class IdentifyResponseSchema(Schema):
    descripcio: str
    etiquetes: List[str]
    intent_id: int


class SearchResultSchema(Schema):
    """Schema polimórfic per a resultats de cerca (Expos o Items)"""
    id: int
    nom: str
    descripcio: str
    type: str  # 'expo' o 'item'
    lloc: Optional[str] = None  # Solo para expos
    data_inici: Optional[str] = None  # Solo para expos
    data_fi: Optional[str] = None  # Solo para expos
    imatge: Optional[str] = None  # URL de la imatge
    expo_id: Optional[int] = None  # Solo para items


# ─── Endpoints: Expos ─────────────────────────────────────────────────────────

@api.get("/test", tags=["Proves"])
def test(request):
    return {"missatge": "UXIA API v2 funciona!"}


@api.get("/expos", response=List[ExpoSchema], tags=["Exposicions"])
def list_expos(request, estat: Optional[str] = None, propietari: Optional[str] = None):
    qs = Expo.objects.all()
    if estat:
        qs = qs.filter(estat=estat)
    if propietari:
        qs = qs.filter(propietari__username=propietari)
    return qs


@api.get("/expos/{expo_id}", response=ExpoDetailSchema, tags=["Exposicions"])
def get_expo(request, expo_id: int):
    return Expo.objects.prefetch_related('items').get(pk=expo_id)


@api.get("/search", response=List[SearchResultSchema], tags=["Búsqueda"])
def search_expos_and_items(request, q: str = ""):
    """
    Endpoint polimórfic de búsqueda que retorna Expos e Items ordenats.
    Primero salen les expos, luego els items.
    Busca solo por nombre (nom).
    """
    results = []
    
    if len(q) < 3:
        return results
    
    # Buscar Expos por nom
    expos = Expo.objects.filter(nom__icontains=q)
    for expo in expos:
        results.append({
            'id': expo.id,
            'nom': expo.nom,
            'descripcio': expo.descripcio,
            'type': 'expo',
            'lloc': expo.lloc,
            'data_inici': str(expo.data_inici),
            'data_fi': str(expo.data_fi),
            'imatge': expo.imatge.url if expo.imatge else None,
        })
    
    # Buscar Items por nom
    items = Item.objects.filter(nom__icontains=q)
    for item in items:
        first_img = item.imatges.filter(es_publica=True).first()
        results.append({
            'id': item.id,
            'nom': item.nom,
            'descripcio': item.descripcio,
            'type': 'item',
            'lloc': None,
            'data_inici': None,
            'data_fi': None,
            'imatge': first_img.imatge.url if first_img else None,
            'expo_id': item.expo_id,
        })
    
    return results
@api.put("/expos/{expo_id}", response=ExpoSchema, tags=["Exposicions"])
def update_expo(request, expo_id: int, data: UpdateExpoSchema = Form(...), imatge: UploadedFile = File(None)):
    """
    Actualitza els detalls d'una exposició.
    """
    expo = Expo.objects.get(pk=expo_id)
    
    # Actualitzar camps de text si s'han enviat
    for attr, value in data.dict().items():
        if value is not None:
            setattr(expo, attr, value)
    
    # Actualitzar imatge si s'ha enviat
    if imatge:
        expo.imatge = imatge
        
    expo.save()
    return expo


# ─── Endpoints: Items ─────────────────────────────────────────────────────────

@api.get("/items", response=List[ItemSchema], tags=["Ítems"])
def list_items(request, expo_id: Optional[int] = None, etiqueta_id: Optional[int] = None):
    qs = Item.objects.prefetch_related('etiquetes')
    if expo_id:
        qs = qs.filter(expo_id=expo_id)
    if etiqueta_id:
        qs = qs.filter(etiquetes__id=etiqueta_id)
    return qs


@api.get("/items/{item_id}", response=ItemDetailSchema, tags=["Ítems"])
def get_item(request, item_id: int):
    return Item.objects.prefetch_related('etiquetes', 'imatges', 'intents').get(pk=item_id)


@api.put("/items/{item_id}", response=ItemSchema, tags=["Ítems"])
def update_item(request, item_id: int, data: UpdateItemSchema = Form(...), imatges: List[UploadedFile] = File(None)):
    """
    Actualitza nom, descripció i etiquetes d'un ítem.
    Si s'afegeixen imatges noves, l'estat de l'expo passa a ACTUALITZABLE.
    """
    item = Item.objects.get(pk=item_id)
    item.nom = data.nom
    item.descripcio = data.descripcio
    item.save()

    etiquetes = Etiqueta.objects.filter(id__in=data.etiquetes_ids)
    item.etiquetes.set(etiquetes)

    if imatges:
        existing_count = item.imatges.count()
        for idx, img_file in enumerate(imatges):
            Imatge.objects.create(
                imatge=img_file,
                item=item,
                ordre=existing_count + idx,
                es_publica=True,
                es_destacada=(existing_count == 0 and idx == 0),
            )
        expo = item.expo
        if expo.estat != Expo.Estat.ACTUALITZABLE:
            expo.estat = Expo.Estat.ACTUALITZABLE
            expo.save()

    return item


@api.post("/items", response=ItemSchema, tags=["Ítems"])
def create_item(request, data: CreateItemSchema = Form(...), imatges: List[UploadedFile] = File(None)):
    """
    Crea un nou ítem, li assigna etiquetes i, si n'hi ha, puja les seves imatges.
    Si s'afegeixen imatges, l'estat de l'exposició passa a 'ACTUALITZABLE'.
    """
    # 1. Crear l'ítem
    item = Item.objects.create(
        nom=data.nom,
        descripcio=data.descripcio,
        expo_id=data.expo_id
    )

    # 2. Assignar etiquetes
    if data.etiquetes_ids:
        etiquetes = Etiqueta.objects.filter(id__in=data.etiquetes_ids)
        item.etiquetes.set(etiquetes)

    # 3. Gestionar imatges
    if imatges:
        for idx, img_file in enumerate(imatges):
            Imatge.objects.create(
                imatge=img_file,
                item=item,
                ordre=idx,
                es_publica=True,
                es_destacada=(idx == 0) # La primera imatge serà la destacada per defecte
            )
        
        # 4. Actualitzar estat de l'expo si s'han afegit imatges
        expo = item.expo
        if expo.estat != Expo.Estat.ACTUALITZABLE:
            expo.estat = Expo.Estat.ACTUALITZABLE
            expo.save()

    return item


@api.put("/items/{item_id}", response=ItemSchema, tags=["Ítems"])
def update_item(request, item_id: int, data: UpdateItemSchema = Form(...), imatges: List[UploadedFile] = File(None)):
    """
    Actualitza els detalls d'un ítem existent.
    """
    item = Item.objects.get(pk=item_id)
    
    # 1. Actualitzar camps de text si s'han enviat
    if data.nom is not None:
        item.nom = data.nom
    if data.descripcio is not None:
        item.descripcio = data.descripcio
        
    # 2. Actualitzar etiquetes si s'ha enviat la llista
    if data.etiquetes_ids is not None:
        etiquetes = Etiqueta.objects.filter(id__in=data.etiquetes_ids)
        item.etiquetes.set(etiquetes)
        
    item.save()

    # 3. Gestionar noves imatges si n'hi ha
    if imatges:
        for idx, img_file in enumerate(imatges):
            Imatge.objects.create(
                imatge=img_file,
                item=item,
                ordre=item.imatges.count(),
                es_publica=True,
                es_destacada=False
            )
        
        # 4. Actualitzar estat de l'expo
        expo = item.expo
        if expo.estat != Expo.Estat.ACTUALITZABLE:
            expo.estat = Expo.Estat.ACTUALITZABLE
            expo.save()

    return item


# ─── Endpoints: Imatges ───────────────────────────────────────────────────────

@api.get("/imatges", response=List[ImatgeSchema], tags=["Imatges"])
def list_imatges(request, item_id: Optional[int] = None, nomes_publiques: bool = False):
    qs = Imatge.objects.all()
    if item_id:
        qs = qs.filter(item_id=item_id)
    if nomes_publiques:
        qs = qs.filter(es_publica=True)
    return qs


# ─── Endpoints: Etiquetes ─────────────────────────────────────────────────────

@api.get("/etiquetes", response=List[EtiquetaSchema], tags=["Etiquetes"])
def list_etiquetes(request, pare_id: Optional[int] = None):
    qs = Etiqueta.objects.all()
    if pare_id:
        qs = qs.filter(pare_id=pare_id)
    elif pare_id == 0:
        qs = qs.filter(pare__isnull=True)  # arrels
    return qs


# ─── Endpoints: Intents ───────────────────────────────────────────────────────

@api.get("/intents", response=List[IntentSchema], tags=["Intents"])
def list_intents(request, item_id: Optional[int] = None, encert: Optional[bool] = None):
    qs = Intent.objects.all()
    if item_id:
        qs = qs.filter(item_id=item_id)
    if encert is not None:
        qs = qs.filter(encert=encert)
    return qs

# ─── Endpoints: IA (marIA 2) ──────────────────────────────────────────────────

@api.post("/identify", response=IdentifyResponseSchema, tags=["IA"])
def identify_item(request, imatge: UploadedFile = File(...)):
    """
    Identifica un ítem a partir d'una foto mitjançant marIA 2 (Ollama).
    Enregistra l'intent i retorna la descripció i etiquetes generades.
    """
    # 1. Enregistrar l'intent
    intent = Intent.objects.create(imatge=imatge)
    
    # 2. Processar l'intent usant la utilitat comuna
    success = process_intent(intent)
    
    if success:
        return {
            "descripcio": intent.descripcio_ia,
            "etiquetes": intent.etiquetes_ia,
            "intent_id": intent.id
        }
    else:
        return {
            "descripcio": intent.descripcio_ia or "Error desconegut en la identificació.",
            "etiquetes": ["error"],
            "intent_id": intent.id
        }

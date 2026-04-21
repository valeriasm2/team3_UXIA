from ninja import NinjaAPI, ModelSchema, Schema, File
from ninja.files import UploadedFile
from typing import List, Optional
import base64
import requests
from django.conf import settings
from .models import Expo, Item, Imatge, Etiqueta, Intent

api = NinjaAPI(title="UXIA API", version="2.0")


# ─── Schemas ──────────────────────────────────────────────────────────────────

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
    class Meta:
        model = Item
        exclude = ['etiquetes']


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


class ExpoDetailSchema(ModelSchema):
    items: List[ItemSchema] = []

    class Meta:
        model = Expo
        fields = '__all__'


class IdentifyResponseSchema(Schema):
    descripcio: str
    etiquetes: List[str]
    intent_id: int


# ─── Endpoints: Expos ─────────────────────────────────────────────────────────

@api.get("/test", tags=["Proves"])
def test(request):
    return {"missatge": "UXIA API v2 funciona!"}


@api.get("/expos", response=List[ExpoSchema], tags=["Exposicions"])
def list_expos(request, estat: Optional[str] = None):
    qs = Expo.objects.all()
    if estat:
        qs = qs.filter(estat=estat)
    return qs


@api.get("/expos/{expo_id}", response=ExpoDetailSchema, tags=["Exposicions"])
def get_expo(request, expo_id: int):
    return Expo.objects.prefetch_related('items').get(pk=expo_id)


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
    # 1. Enregistrar l'intent al servidor
    intent = Intent.objects.create(imatge=imatge)
    
    # 2. Preparar imatge per a Ollama (Base64)
    imatge.seek(0)
    image_data = base64.b64encode(imatge.read()).decode('utf-8')
    
    # 3. Cridar al servei marIA 2
    payload = {
        "model": "marIA2",
        "prompt": "Identifica aquest objecte. Respon en català amb una descripció curta i una llista d'etiquetes separades per comes al final. Format: Descripció | etiqueta1, etiqueta2",
        "stream": False,
        "images": [image_data]
    }
    
    try:
        response = requests.post(
            f"{settings.OLLAMA_URL}/api/generate",
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()
        raw_text = data.get("response", "")
        
        # 4. Processar la resposta de la IA
        if "|" in raw_text:
            parts = raw_text.split("|", 1)
            descripcio = parts[0].strip()
            etiquetes = [t.strip() for t in parts[1].split(",")]
        else:
            descripcio = raw_text.strip()
            etiquetes = ["IA"]

        return {
            "descripcio": descripcio,
            "etiquetes": etiquetes,
            "intent_id": intent.id
        }
        
    except Exception as e:
        return {
            "descripcio": f"Error de connexió amb marIA 2: {str(e)}",
            "etiquetes": ["error"],
            "intent_id": intent.id
        }

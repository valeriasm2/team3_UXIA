from ninja import NinjaAPI, ModelSchema, Schema, File, Form
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
    nom: Optional[str] = None
    descripcio: Optional[str] = None
    etiquetes_ids: Optional[List[int]] = None


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
    # 1. Enregistrar l'intent al servidor
    intent = Intent.objects.create(imatge=imatge)
    
    # 2. Preparar imatge per a Ollama (Base64)
    imatge.seek(0)
    image_data = base64.b64encode(imatge.read()).decode('utf-8')
    
    import ollama
    
    # 3. Cridar al servei marIA 2
    prompt = (
        "Identifica aquest objecte de l'exposició. Respon en català. "
        "Proporciona una descripció breu de 5 línies de l'objecte i després una llista d'etiquetes clau. "
        "Format obligatori: DESCRIPCIÓ | etiqueta1, etiqueta2, etiqueta3"
    )
    
    try:
        # Reutilitzem OLLAMA_URL de settings perquè funcioni correctament tant en local amb SSH com en producció
        client = ollama.Client(host=settings.OLLAMA_URL)
        response = client.chat(
             model='qwen3-vl:30b',
             messages=[{
                 'role': 'user',
                 'content': prompt,
                 'images': [image_data]
             }]
        )
        
        raw_text = response['message']['content'].strip()
        descripcio = ""
        etiquetes_raw = ""
        
        # Estratègia robusta de parsing
        if "|" in raw_text:
            parts = raw_text.split("|", 1)
            descripcio = parts[0]
            etiquetes_raw = parts[1]
        else:
            hash_idx = raw_text.find("#")
            # Si trobem '#' a la meitat del text, considerem que és on comencen les etiquetes
            if hash_idx > 5:
                descripcio = raw_text[:hash_idx]
                etiquetes_raw = raw_text[hash_idx:]
            elif "\n" in raw_text:
                lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
                if len(lines) > 1:
                    descripcio = "\n".join(lines[:-1])
                    etiquetes_raw = lines[-1]
                else:
                    descripcio = raw_text
            else:
                descripcio = raw_text

        # 4.1 Netejar Descripció
        descripcio = descripcio.strip()
        if descripcio.startswith("#"):
            descripcio = descripcio[1:].strip()
        if descripcio.lower().startswith("descripció:"):
            descripcio = descripcio[11:].strip()
            
        # El model qwen3 de vegades empra hashtags com separadors dins de la frase
        descripcio = descripcio.replace("#", ", ")
        
        # Netejar espais repetits just davant de les comes
        import re
        descripcio = re.sub(r'\s+,', ',', descripcio)
            
        # 4.2 Netejar Etiquetes
        etiquetes_raw = etiquetes_raw.strip()
        if etiquetes_raw.lower().startswith("etiquetes:"):
            etiquetes_raw = etiquetes_raw[10:].strip()
            
        etiquetes_raw = etiquetes_raw.replace("#", ",")
        etiquetes = [t.strip() for t in etiquetes_raw.split(",") if t.strip()]
        
        if not etiquetes:
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

from ninja import NinjaAPI, ModelSchema, Schema, File, Form
from ninja.files import UploadedFile
from ninja.errors import HttpError
from typing import List, Optional
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
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
        fields = ['id', 'imatge', 'es_publica', 'es_destacada', 'ordre', 'creat_el']


class IntentSchema(ModelSchema):
    class Meta:
        model = Intent
        fields = ['id', 'imatge', 'item', 'encert', 'confiança', 'descripcio_ia', 'etiquetes_ia', 'creat_el']


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
    imatge_destacada_idx: Optional[int] = 0


class UpdateItemSchema(Schema):
    nom: str
    descripcio: str
    etiquetes_ids: List[int] = []
    imatge_destacada_idx: Optional[int] = None
    imatge_destacada_id: Optional[int] = None
    imatges_conservadas_ids: List[int] = []


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
    id: int
    nom: str
    descripcio: str
    type: str
    lloc: Optional[str] = None
    data_inici: Optional[str] = None
    data_fi: Optional[str] = None
    imatge: Optional[str] = None
    expo_id: Optional[int] = None


# ─── Endpoints: Auth ──────────────────────────────────────────────────────────

@api.post("/auth/login", response=LoginResponseSchema, tags=["Auth"])
def login(request, data: LoginSchema):
    user = authenticate(username=data.username, password=data.password)
    if not user:
        raise HttpError(401, "Credencials incorrectes")
    token, _ = Token.objects.get_or_create(user=user)
    return {"token": token.key, "user": user.username}


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


@api.put("/expos/{expo_id}", response=ExpoSchema, tags=["Exposicions"])
def update_expo(request, expo_id: int, data: UpdateExpoSchema = Form(...), imatge: UploadedFile = File(None)):
    expo = Expo.objects.get(pk=expo_id)
    for attr, value in data.dict().items():
        if value is not None:
            setattr(expo, attr, value)
    if imatge:
        expo.imatge = imatge
    expo.save()
    return expo


@api.get("/search", response=List[SearchResultSchema], tags=["Búsqueda"])
def search_expos_and_items(request, q: str = ""):
    """Cerca polimòrfica: primer expos, després ítems."""
    results = []

    if len(q) < 3:
        return results

    for expo in Expo.objects.filter(nom__icontains=q):
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

    for item in Item.objects.filter(nom__icontains=q):
        first_img = item.imatges.filter(es_publica=True).first()
        results.append({
            'id': item.id,
            'nom': item.nom,
            'descripcio': item.descripcio,
            'type': 'item',
            'imatge': first_img.imatge.url if first_img else None,
            'expo_id': item.expo_id,
        })

    return results


# ─── Endpoints: Items ─────────────────────────────────────────────────────────

@api.get("/items", response=List[ItemSchema], tags=["Ítems"])
def list_items(request, expo_id: Optional[int] = None, etiqueta_id: Optional[int] = None):
    qs = Item.objects.prefetch_related('etiquetes', 'imatges')
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
    """Crea un nou ítem. Si s'afegeixen imatges, l'expo passa a ACTUALITZABLE."""
    item = Item.objects.create(
        nom=data.nom,
        descripcio=data.descripcio,
        expo_id=data.expo_id
    )

    if data.etiquetes_ids:
        item.etiquetes.set(Etiqueta.objects.filter(id__in=data.etiquetes_ids))

    if imatges:
        destacada_idx = data.imatge_destacada_idx if data.imatge_destacada_idx is not None else 0
        
        # Asegurar que el índice es válido
        if destacada_idx >= len(imatges):
            destacada_idx = 0
            
        for idx, img_file in enumerate(imatges):
            Imatge.objects.create(
                imatge=img_file,
                item=item,
                ordre=idx,
                es_publica=True,
                es_destacada=(idx == destacada_idx),
            )
        expo = item.expo
        if expo.estat != Expo.Estat.ACTUALITZABLE:
            expo.estat = Expo.Estat.ACTUALITZABLE
            expo.save()

    return item


@api.put("/items/{item_id}", response=ItemSchema, tags=["Ítems"])
def update_item(request, item_id: int, data: UpdateItemSchema = Form(...), imatges: List[UploadedFile] = File(None)):
    """Actualitza un ítem. Si s'afegeixen o s'eliminen imatges, l'expo passa a ACTUALITZABLE."""
    item = Item.objects.get(pk=item_id)
    item.nom = data.nom
    item.descripcio = data.descripcio
    item.save()

    item.etiquetes.set(Etiqueta.objects.filter(id__in=data.etiquetes_ids))

    # Manejar eliminación de imágenes conservadas
    if data.imatges_conservadas_ids:
        imatges_a_eliminar = item.imatges.exclude(id__in=data.imatges_conservadas_ids)
        if imatges_a_eliminar.exists():
            imatges_a_eliminar.delete()
            
            # Si se eliminó la imagen destacada, marcar la primera como destacada
            if not item.imatges.filter(es_destacada=True).exists():
                primera_img = item.imatges.first()
                if primera_img:
                    primera_img.es_destacada = True
                    primera_img.save()
            
            # Marcar expo como ACTUALITZABLE si se eliminaron imágenes
            expo = item.expo
            if expo.estat != Expo.Estat.ACTUALITZABLE:
                expo.estat = Expo.Estat.ACTUALITZABLE
                expo.save()

    # Manejar cambio de imagen destacada (sin nuevas imágenes)
    if data.imatge_destacada_id and not imatges:
        # Desmarcar todas las imágenes destacadas de este item
        item.imatges.update(es_destacada=False)
        # Marcar la imagen especificada como destacada
        try:
            img = Imatge.objects.get(id=data.imatge_destacada_id, item=item)
            img.es_destacada = True
            img.save()
        except Imatge.DoesNotExist:
            pass

    # Agregar nuevas imágenes
    if imatges:
        existing_count = item.imatges.count()
        destacada_idx = data.imatge_destacada_idx if data.imatge_destacada_idx is not None else 0
        
        # Asegurar que el índice es válido
        if destacada_idx >= len(imatges):
            destacada_idx = 0
        
        # Si se van a agregar nuevas imágenes, desmarcar la actual destacada
        if existing_count > 0:
            item.imatges.update(es_destacada=False)
        
        for idx, img_file in enumerate(imatges):
            Imatge.objects.create(
                imatge=img_file,
                item=item,
                ordre=existing_count + idx,
                es_publica=True,
                es_destacada=(idx == destacada_idx),
            )
        
        expo = item.expo
        if expo.estat != Expo.Estat.ACTUALITZABLE:
            expo.estat = Expo.Estat.ACTUALITZABLE
            expo.save()

    return item

@api.delete("/items/{item_id}", tags=["Ítems"])
def delete_item(request, item_id: int):
    """Elimina un ítem sencer. L'expo associada passa a l'estat ACTUALITZABLE per recalcular si hi falten imatges... encara que es pot treure això."""
    try:
        item = Item.objects.get(pk=item_id)
        expo = item.expo
        item.delete()
        if expo.estat != Expo.Estat.ACTUALITZABLE:
            expo.estat = Expo.Estat.ACTUALITZABLE
            expo.save()
        return {"success": True}
    except Item.DoesNotExist:
        raise HttpError(404, "Ítem no trobat")


# ─── Endpoints: Imatges ───────────────────────────────────────────────────────

@api.get("/imatges", response=List[ImatgeSchema], tags=["Imatges"])
def list_imatges(
    request,
    item_id: Optional[int] = None,
    nomes_publiques: bool = False,
    es_destacada: Optional[bool] = None,
):
    qs = Imatge.objects.all()
    if item_id:
        qs = qs.filter(item_id=item_id)
    if nomes_publiques:
        qs = qs.filter(es_publica=True)
    if es_destacada is not None:
        qs = qs.filter(es_destacada=es_destacada)
    return qs


@api.put("/imatges/{imatge_id}/destacar", response=ImatgeSchema, tags=["Imatges"])
def set_highlighted_image(request, imatge_id: int):
    """Marca una imatge com a destacada per al seu item."""
    imatge = Imatge.objects.get(pk=imatge_id)
    
    # Desmarcar la actual destacada per al mateix item
    imatge.item.imatges.update(es_destacada=False)
    
    # Marcar la nova com a destacada
    imatge.es_destacada = True
    imatge.save()
    
    # Marcar la expo com a ACTUALITZABLE
    expo = imatge.item.expo
    if expo.estat != Expo.Estat.ACTUALITZABLE:
        expo.estat = Expo.Estat.ACTUALITZABLE
        expo.save()
    
    return imatge


# ─── Endpoints: Etiquetes ─────────────────────────────────────────────────────

@api.get("/etiquetes", response=List[EtiquetaSchema], tags=["Etiquetes"])
def list_etiquetes(request, pare_id: Optional[int] = None):
    qs = Etiqueta.objects.all()
    if pare_id:
        qs = qs.filter(pare_id=pare_id)
    elif pare_id == 0:
        qs = qs.filter(pare__isnull=True)
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
    """Identifica un ítem a partir d'una foto mitjançant marIA 2 (Ollama)."""
    intent = Intent.objects.create(imatge=imatge)
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

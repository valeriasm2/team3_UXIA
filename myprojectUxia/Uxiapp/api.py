from ninja import NinjaAPI, ModelSchema, Schema, File, Form
from ninja.files import UploadedFile
from ninja.errors import HttpError
from typing import List, Optional
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
import uuid
from rest_framework.authtoken.models import Token
from .models import Expo, Item, Imatge, Etiqueta, Intent, UsuariAnonim
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
    imatge: str = ""

    class Meta:
        model = Item
        exclude = ['etiquetes']

    @staticmethod
    def resolve_imatge(obj):
        try:
            # Seleccionem la primera imatge pública
            first_img = obj.imatges.filter(es_publica=True).first()
            if first_img and first_img.imatge:
                return first_img.imatge.url
        except (ValueError, Exception):
            pass
        return ""


class ItemDetailSchema(ModelSchema):
    imatges: List[ImatgeSchema] = []
    intents: List[IntentSchema] = []
    etiquetes: List[EtiquetaSchema] = []

    class Meta:
        model = Item
        exclude = ['etiquetes']


class ExpoSchema(ModelSchema):
    imatge: str = ""

    class Meta:
        model = Expo
        exclude = ['imatge']
        fields = '__all__'

    @staticmethod
    def resolve_imatge(obj):
        try:
            if obj.imatge:
                return obj.imatge.url
        except (ValueError, Exception):
            pass
        return ""


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
    imatge: str = ""

    class Meta:
        model = Expo
        exclude = ['imatge']
        fields = '__all__'

    @staticmethod
    def resolve_imatge(obj):
        try:
            if obj.imatge:
                return obj.imatge.url
        except Exception:
            pass
        return ""


class IdentifyResponseSchema(Schema):
    descripcio: str
    etiquetes: List[str]
    intent_id: int
    cookie_id: Optional[str] = None


class SearchResultSchema(Schema):
    id: int
    nom: str
    descripcio: str
    type: str
    lloc: Optional[str] = None
    data_inici: Optional[str] = None
    data_fi: Optional[str] = ""
    imatge: str = ""
    expo_id: Optional[int] = None


# ─── Schemas d'Usuari Anònim ──────────────────────────────────────────────────

class UsuariAnonimSchema(Schema):
    id: int
    cookie_id: str
    data_creacio: str
    ultima_activitat: str


class IdentificarUsuariResponse(Schema):
    cookie_id: str
    es_nou: bool


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
    try:
        expo = Expo.objects.get(pk=expo_id)
        for attr, value in data.dict().items():
            if value is not None:
                setattr(expo, attr, value)
        if imatge:
            expo.imatge = imatge
        
        # Save the expo
        expo.save()
        
        # Refresh from DB to ensure all fields are correct
        expo.refresh_from_db()
        return expo
    except Exception as e:
        import traceback
        print(f"ERROR in update_expo: {str(e)}")
        print(traceback.format_exc())
        raise HttpError(500, f"Error actualitzant expo: {str(e)}")


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

    images_changed = False

    # Eliminar imágenes no conservadas (siempre, incluso si la lista está vacía)
    a_eliminar = item.imatges.exclude(id__in=data.imatges_conservadas_ids)
    if a_eliminar.exists():
        images_changed = True
        a_eliminar.delete()

    # Añadir nuevas imágenes (sin marcar destacada aún)
    new_image_ids = []
    if imatges:
        images_changed = True
        existing_count = item.imatges.count()
        for idx, img_file in enumerate(imatges):
            new_img = Imatge.objects.create(
                imatge=img_file,
                item=item,
                ordre=existing_count + idx,
                es_publica=True,
                es_destacada=False,
            )
            new_image_ids.append(new_img.id)

    # Establecer imagen destacada
    if data.imatge_destacada_id:
        # Destacada es una imagen existente (conservada o ya estaba)
        item.imatges.update(es_destacada=False)
        try:
            img = Imatge.objects.get(id=data.imatge_destacada_id, item=item)
            img.es_destacada = True
            img.save()
        except Imatge.DoesNotExist:
            pass
    elif data.imatge_destacada_idx is not None and new_image_ids:
        # Destacada es una imagen nueva: índice dentro del array de nuevas
        idx = data.imatge_destacada_idx
        target_id = new_image_ids[idx] if 0 <= idx < len(new_image_ids) else new_image_ids[0]
        item.imatges.update(es_destacada=False)
        Imatge.objects.filter(id=target_id).update(es_destacada=True)
    else:
        # Sin cambio explícito: si no hay ninguna destacada, marcar la primera
        if not item.imatges.filter(es_destacada=True).exists():
            primera = item.imatges.first()
            if primera:
                primera.es_destacada = True
                primera.save()

    if images_changed:
        print(f"DEBUG: Imatges canviades per item {item.id}, marcant expo {item.expo.id} com ACTUALITZABLE")
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


# ─── Endpoints: Usuari Anònim ─────────────────────────────────────────────────

@api.post("/usuari/identificar", response=IdentificarUsuariResponse, tags=["Usuari"])
def identificar_usuari(request, cookie_id: str = None):
    """
    Identifica o crea un usuari anònim a partir d'una cookie.
    Si no existeix, el crea.
    """
    if cookie_id:
        try:
            usuari = UsuariAnonim.objects.get(cookie_id=cookie_id)
            # Actualitzar última activitat
            usuari.ultima_activitat = timezone.now()
            usuari.save()
            return {
                "cookie_id": usuari.cookie_id,
                "es_nou": False
            }
        except UsuariAnonim.DoesNotExist:
            pass
    
    # Crear nou usuari
    nou_cookie_id = str(uuid.uuid4())
    usuari = UsuariAnonim.objects.create(cookie_id=nou_cookie_id)
    
    return {
        "cookie_id": usuari.cookie_id,
        "es_nou": True
    }


@api.get("/usuari/actual", response=UsuariAnonimSchema, tags=["Usuari"])
def get_usuari_actual(request, cookie_id: str):
    """Obté la informació de l'usuari actual a partir de la cookie"""
    try:
        usuari = UsuariAnonim.objects.get(cookie_id=cookie_id)
        return {
            "id": usuari.id,
            "cookie_id": usuari.cookie_id,
            "data_creacio": usuari.data_creacio.isoformat(),
            "ultima_activitat": usuari.ultima_activitat.isoformat()
        }
    except UsuariAnonim.DoesNotExist:
        return None


# ─── Endpoints: Intents ───────────────────────────────────────────────────────

@api.get("/intents", response=List[IntentSchema], tags=["Intents"])
def list_intents(request, item_id: Optional[int] = None, encert: Optional[bool] = None, cookie_id: str = None):
    """Llistar intents. Si es proporciona cookie_id, només els de l'usuari anònim."""
    qs = Intent.objects.all()
    
    # Filtrar per usuari anònim si s'especifica cookie_id
    if cookie_id:
        try:
            usuari = UsuariAnonim.objects.get(cookie_id=cookie_id)
            qs = qs.filter(usuari_anonim=usuari)
        except UsuariAnonim.DoesNotExist:
            return []
    
    if item_id:
        qs = qs.filter(item_id=item_id)
    if encert is not None:
        qs = qs.filter(encert=encert)
    
    return qs


# ─── Endpoints: IA (marIA 2) ──────────────────────────────────────────────────

@api.post("/identify", response=IdentifyResponseSchema, tags=["IA"])
def identify_item(request, imatge: UploadedFile = File(...), cookie_id: str = Form(None)):
    """
    Identifica un ítem a partir d'una foto mitjançant marIA 2 (Ollama).
    L'intent s'associa a l'usuari anònim identificat per la cookie.
    """
    # Obtenir o crear usuari anònim
    usuari = None
    if cookie_id:
        try:
            usuari = UsuariAnonim.objects.get(cookie_id=cookie_id)
            usuari.ultima_activitat = timezone.now()
            usuari.save()
        except UsuariAnonim.DoesNotExist:
            pass
    
    if not usuari:
        # Crear nou usuari
        nou_cookie_id = str(uuid.uuid4())
        usuari = UsuariAnonim.objects.create(cookie_id=nou_cookie_id)
        cookie_id = nou_cookie_id
    
    # Crear intent associat a l'usuari
    intent = Intent.objects.create(imatge=imatge, usuari_anonim=usuari)
    success = process_intent(intent)

    # Refrescar per llegir resultats de la IA dats per process_intent
    intent.refresh_from_db()

    return {
        "descripcio": intent.descripcio_ia or "",
        "etiquetes": intent.etiquetes_ia or [],
        "intent_id": intent.id,
        "cookie_id": cookie_id
    }
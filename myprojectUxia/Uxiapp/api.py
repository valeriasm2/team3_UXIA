from ninja import NinjaAPI, ModelSchema
from typing import List
from .models import Expo, Item, Imatge, Etiqueta, Intents
from django.shortcuts import get_object_or_404  # Añade esta importación

api = NinjaAPI(title="UXIA API")

# -- ESQUEMAS EXISTENTES (tuyos) --
class ExpoSchema(ModelSchema):
    class Meta:
        model = Expo
        fields = "__all__"

class ItemSchema(ModelSchema):
    class Meta:
        model = Item
        fields = "__all__"

class ImatgeSchema(ModelSchema):
    class Meta:
        model = Imatge
        fields = "__all__"

class EtiquetaSchema(ModelSchema):
    class Meta:
        model = Etiqueta
        fields = "__all__"

class IntentsSchema(ModelSchema):
    class Meta:
        model = Intents
        fields = "__all__"

# -- NUEVOS SCHEMAS PARA EL CARROUSEL --
class ItemCarrouselSchema(ModelSchema):
    """Esquema simplificado para el carrousel con imagen destacada"""
    imagen_destacada: str = None
    
    class Meta:
        model = Item
        fields = ["id", "nombre", "descripcion"]
    
    @staticmethod
    def resolve_imagen_destacada(obj):
        """Obtiene la URL de la imagen destacada del item"""
        # Prioridad: imagen destacada en Imatge > imagen del Item > primera imagen
        destacada = obj.imagenes.filter(es_destacada=True).first()
        if destacada:
            return destacada.imagen.url
        elif obj.imagen:
            return obj.imagen.url
        elif obj.imagenes.first():
            return obj.imagenes.first().imagen.url
        return None

class ExpoCarrouselSchema(ModelSchema):
    """Esquema para exposición con sus items para el carrousel"""
    items: List[ItemCarrouselSchema] = []
    total_items: int = 0
    
    class Meta:
        model = Expo
        fields = ["id", "nombre", "descripcion", "lugar", "imagen"]
    
    @staticmethod
    def resolve_items(obj):
        return obj.items.all()
    
    @staticmethod
    def resolve_total_items(obj):
        return obj.items.count()

# -- ENDPOINTS EXISTENTES (tus endpoints, no tocar) --
@api.get("/test", tags=["Pruebas"])
def test(request):
    return {"mensaje": "Django y React conectados!"}

@api.get("/expos", response=List[ExpoSchema], tags=["Exposiciones"])
def list_expos(request):
    return Expo.objects.all()

@api.get("/items", response=List[ItemSchema], tags=["Items"])
def list_items(request, expo_id: int = None):
    if expo_id:
        return Item.objects.filter(expo_id=expo_id)
    return Item.objects.all()

@api.get("/imatges", response=List[ImatgeSchema], tags=["Imagenes"])
def list_imatges(request, item_id: int = None, solo_publicas: bool = False, destacada: bool = None):
    filtros = {}
    if item_id:
        filtros["item_id"] = item_id
    if solo_publicas:
        filtros["es_publica"] = True
    if destacada is not None:
        filtros["es_destacada"] = destacada
    return Imatge.objects.filter(**filtros)

@api.get("/etiquetas", response=List[EtiquetaSchema], tags=["Etiquetas"])
def list_etiquetas(request):
    return Etiqueta.objects.all()

@api.get("/intents", response=List[IntentsSchema], tags=["Intentos"])
def list_intents(request):
    return Intents.objects.all()

# -- NUEVOS ENDPOINTS PARA EL CARROUSEL --
@api.get("/expos/{expo_id}/carrousel", response=ExpoCarrouselSchema, tags=["Carrousel"])
def get_expo_carrousel(request, expo_id: int):
    """
    Endpoint específico para el carrousel.
    Devuelve la exposición con sus items y la imagen destacada de cada uno.
    """
    expo = get_object_or_404(Expo, id=expo_id)
    return expo

@api.get("/expos/{expo_id}/items-simples", response=List[ItemCarrouselSchema], tags=["Carrousel"])
def get_expo_items_simples(request, expo_id: int):
    """
    Endpoint que devuelve SOLO los items de una exposición (simplificado para carrousel).
    """
    expo = get_object_or_404(Expo, id=expo_id)
    return expo.items.all()

@api.get("/expos-disponibles", response=List[ExpoCarrouselSchema], tags=["Carrousel"])
def get_expos_disponibles(request):
    """
    Endpoint para listar solo exposiciones disponibles (estado DISPONIBLE)
    """
    return Expo.objects.filter(estado='DISPONIBLE')
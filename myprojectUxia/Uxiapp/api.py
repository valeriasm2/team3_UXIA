from ninja import NinjaAPI, ModelSchema
from typing import List
from .models import Expo, Item, Imatge, Etiqueta, Intents

api = NinjaAPI(title="UXIA API")

# -- ESQUEMAS (Traducción de modelos a JSON) --
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

# -- ENDPOINTS --
@api.get("/test", tags=["Pruebas"])
def test(request):
    return {"mensaje": "Django y React conectados!"}

@api.get("/expos", response=List[ExpoSchema], tags=["Exposiciones"])
def list_expos(request):
    return Expo.objects.all()

@api.get("/items", response=List[ItemSchema], tags=["Items"])
def list_items(request, expo_id: int = None):
    # Si pasamos un expo_id, filtra por exposición
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
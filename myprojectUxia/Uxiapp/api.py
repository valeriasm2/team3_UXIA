from ninja import NinjaAPI

api = NinjaAPI()

@api.get("/test")
def test(request):
    return {"mensaje": "Django y React conectados!"}
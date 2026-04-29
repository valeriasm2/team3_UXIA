import base64
import re
import ollama
from django.conf import settings
from .models import Item, Intent

def solve_best_item(descripcio, etiquetes):
    """
    Cerca el millor ítem que coincideixi amb la descripció o etiquetes de la IA.
    """
    best_item = None
    max_score = 0
    
    items = Item.objects.prefetch_related('etiquetes').all()
    
    # Normalitzem etiquetes de la IA
    ai_tags = [t.lower().replace("-", " ") for t in etiquetes]
    ai_text = descripcio.lower()

    for item in items:
        score = 0
        nom_low = item.nom.lower().replace("-", " ")
        
        # 1. Coincidència per nom (pes alt)
        if any(word in ai_text for word in nom_low.split()):
            score += 10
        if any(word in ai_tags for word in nom_low.split()):
            score += 15
        
        # 2. Coincidència per etiquetes de l'item (pes mitjà)
        for tag in item.etiquetes.all():
            tag_nom = tag.nom.lower()
            if tag_nom in ai_tags:
                score += 5
            if tag_nom in ai_text:
                score += 3
        
        if score > max_score:
            max_score = score
            best_item = item
            
    return best_item, max_score

def identify_image_data(image_bytes):
    """
    Cridar al servei Ollama per identificar una imatge.
    Retorna (descripcio, etiquetes)
    """
    try:
        image_data = base64.b64encode(image_bytes).decode('utf-8')

        prompt = (
            "Identifica aquest objecte de l'exposició. Respon en català. "
            "Proporciona una descripció breu de 5 línies de l'objecte i després una llista d'etiquetes clau. "
            "Format obligatori: DESCRIPCIÓ | etiqueta1, etiqueta2, etiqueta3"
        )

        client = ollama.Client(host=settings.OLLAMA_URL)
        response = client.chat(
             model='qwen2.5vl:7b',
             messages=[{
                 'role': 'user',
                 'content': prompt,
                 'images': [image_data]
             }]
        )
    except Exception as e:
        print(f"Error connectant amb Ollama: {str(e)}")
        raise Exception(f"No s'ha pogut connectar amb el servei d'IA: {str(e)}")
    
    raw_text = response['message']['content'].strip()
    descripcio = ""
    etiquetes_raw = ""
    
    if "|" in raw_text:
        parts = raw_text.split("|", 1)
        descripcio = parts[0]
        etiquetes_raw = parts[1]
    else:
        hash_idx = raw_text.find("#")
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

    descripcio = descripcio.strip()
    if descripcio.startswith("#"):
        descripcio = descripcio[1:].strip()
    if descripcio.lower().startswith("descripció:"):
        descripcio = descripcio[11:].strip()
    descripcio = descripcio.replace("#", ", ")
    descripcio = re.sub(r'\s+,', ',', descripcio)
        
    etiquetes_raw = etiquetes_raw.strip()
    if etiquetes_raw.lower().startswith("etiquetes:"):
        etiquetes_raw = etiquetes_raw[10:].strip()
    etiquetes_raw = etiquetes_raw.replace("#", ",")
    etiquetes = [t.strip() for t in etiquetes_raw.split(",") if t.strip()]
    
    if not etiquetes:
        etiquetes = ["IA"]
        
    return descripcio, etiquetes

def process_intent(intent):
    """
    Processa un intent existent: crida a la IA i desa resultats.
    """
    try:
        with intent.imatge.open('rb') as f:
            image_bytes = f.read()

        descripcio, etiquetes = identify_image_data(image_bytes)
        best_item, score = solve_best_item(descripcio, etiquetes)

        intent.descripcio_ia = descripcio
        intent.etiquetes_ia = etiquetes
        intent.item = best_item
        intent.confiança = min(1.0, score / 50.0)
        intent.encert = True if score > 15 else None
        intent.save()
        return True
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        print(f"Error en process_intent: {error_detail}")
        intent.descripcio_ia = f"Error en processar la imatge: {str(e)}"
        intent.etiquetes_ia = ["error"]
        intent.save()
        return False

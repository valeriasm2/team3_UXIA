from django.core.management.base import BaseCommand
from Uxiapp.models import Intent
from Uxiapp.ai_utils import process_intent

class Command(BaseCommand):
    help = 'Processa els intents pendents usant la IA per omplir les columnes de la base de dades.'

    def handle(self, *args, **options):
        # Busquem intents que no tenen descripció de la IA (indicatiu de que no s'han processat completament)
        # o que no tenen ítem assignat
        intents_pendents = Intent.objects.filter(descripcio_ia__isnull=True)
        
        total = intents_pendents.count()
        self.stdout.write(self.style.NOTICE(f"Trobats {total} intents per processar."))
        
        for i, intent in enumerate(intents_pendents, 1):
            self.stdout.write(f"[{i}/{total}] Processant intent {intent.id}...")
            success = process_intent(intent)
            if success:
                nom_item = intent.item.nom if intent.item else "Cap coincidència"
                self.stdout.write(self.style.SUCCESS(f"Intent {intent.id} processat: {nom_item}"))
            else:
                self.stdout.write(self.style.ERROR(f"Error processant intent {intent.id}: {intent.descripcio_ia}"))
                
        self.stdout.write(self.style.SUCCESS("Procés finalitzat."))

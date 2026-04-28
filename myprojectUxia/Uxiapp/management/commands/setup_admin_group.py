from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group


class Command(BaseCommand):
    help = 'Crea el grupo "Admins" y asigna el usuario admin a ese grupo'

    def handle(self, *args, **options):
        # Crear o obtener el grupo "Admins"
        group, created = Group.objects.get_or_create(name="Admins")
        
        if created:
            self.stdout.write(self.style.SUCCESS('Grupo "Admins" creado exitosamente'))
        else:
            self.stdout.write(self.style.WARNING('Grupo "Admins" ya existe'))
        
        # Obtener el usuario admin
        try:
            admin_user = User.objects.get(username='admin')
            
            # Agregar el usuario al grupo
            admin_user.groups.add(group)
            
            self.stdout.write(self.style.SUCCESS(f'Usuario "admin" asignado al grupo "Admins"'))
        except User.DoesNotExist:
            self.stdout.write(self.style.WARNING('Usuario "admin" no existe. Créalo primero con:'))
            self.stdout.write('  python manage.py createsuperuser')

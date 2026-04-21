from django.contrib import admin
from django.utils.html import format_html
from .models import Expo, Item, Imatge, Etiqueta, Intents

# 1. Inline de Imágenes para meter dentro del Item
class ImatgeInline(admin.TabularInline):
    model = Imatge
    extra = 1
    fields = ['imagen', 'imagen_preview', 'es_publica']
    readonly_fields = ['imagen_preview']
    
    def imagen_preview(self, obj):
        if obj.imagen:
            return format_html('<img src="{}" width="100" height="100" style="object-fit: cover;" />', obj.imagen.url)
        return "Sin imagen"
    imagen_preview.short_description = "Preview"

# 1.5. Inline de Etiquetas para meter dentro del Item
class EtiquetaInline(admin.TabularInline):
    model = Etiqueta
    extra = 1
    fields = ['nombre', 'padre']

# 2. Inline de Items para meter dentro de la Expo
class ItemInline(admin.TabularInline):
    model = Item
    extra = 1
    show_change_link = True # Permite hacer clic para ir al detalle del coche

# 3. Configuración del Item en el Admin
@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'expo', 'imagen_destacada_preview_list']
    inlines = [EtiquetaInline, ImatgeInline] # Etiquetas e imágenes de cada coche
    fields = ['nombre', 'descripcion', 'expo', 'imagen_destacada_preview']
    readonly_fields = ['imagen_destacada_preview', 'imagen_destacada_preview_list']
    
    def imagen_destacada_preview(self, obj):
        imagen_destacada = obj.imagenes.filter(es_destacada=True).first()
        if imagen_destacada and imagen_destacada.imagen:
            return format_html('<img src="{}" width="200" height="200" style="object-fit: cover;" />', imagen_destacada.imagen.url)
        return "Sin imagen destacada"
    imagen_destacada_preview.short_description = "Imagen Destacada"
    
    def imagen_destacada_preview_list(self, obj):
        imagen_destacada = obj.imagenes.filter(es_destacada=True).first()
        if imagen_destacada and imagen_destacada.imagen:
            return format_html('<img src="{}" width="80" height="80" style="object-fit: cover;" />', imagen_destacada.imagen.url)
        return "-"
    imagen_destacada_preview_list.short_description = "Preview"

# 4. Configuración de la Expo en el Admin
@admin.register(Expo)
class ExpoAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'fecha_inicio', 'lugar', 'estado']
    inlines = [ItemInline] # Aquí metemos los 8 coches (items)
    fields = ['nombre', 'fecha_inicio', 'fecha_fin', 'lugar', 'descripcion', 'estado', 'imagen', 'imagen_preview']
    readonly_fields = ['imagen_preview']
    
    def imagen_preview(self, obj):
        if obj.imagen:
            return format_html('<img src="{}" width="200" height="200" style="object-fit: cover;" />', obj.imagen.url)
        return "Sin imagen"
    imagen_preview.short_description = "Preview de Imagen"

# Registros simples para el resto
admin.site.register(Etiqueta)
admin.site.register(Intents)
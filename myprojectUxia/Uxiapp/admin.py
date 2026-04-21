from django.contrib import admin
from django.utils.html import format_html
from .models import Expo, Item, Imatge, Etiqueta, Intent


# ─── Helper de previsualització d'imatge ──────────────────────────────────────

def img_preview(image_field, size=80):
    """Retorna una <img> HTML o un guió si no hi ha fitxer."""
    if image_field:
        return format_html(
            '<img src="{url}" style="max-height:{s}px; max-width:{s}px;'
            ' object-fit:cover; border-radius:6px; box-shadow:0 1px 4px #0002;" />',
            url=image_field.url, s=size
        )
    return format_html('<span style="color:#aaa;">—</span>')


# ─── Inlines ──────────────────────────────────────────────────────────────────

class ImatgeInline(admin.TabularInline):
    model = Imatge
    extra = 1
    ordering = ['ordre']
    fields = ('imatge', '_preview', 'es_destacada', 'es_publica', 'ordre')
    readonly_fields = ('_preview',)

    @admin.display(description='Previsualització')
    def _preview(self, obj):
        return img_preview(obj.imatge)


class IntentInline(admin.TabularInline):
    model = Intent
    extra = 0
    fields = ('imatge', '_preview', 'encert', 'confiança', 'creat_el')
    readonly_fields = ('_preview', 'creat_el')

    @admin.display(description='Miniatura')
    def _preview(self, obj):
        return img_preview(obj.imatge, size=60)


class ItemEtiquetaInline(admin.TabularInline):
    model = Item.etiquetes.through
    extra = 1
    verbose_name = "Etiqueta"
    verbose_name_plural = "Etiquetes"


class ItemInline(admin.TabularInline):
    model = Item
    extra = 1
    show_change_link = True
    fields = ('nom', '_preview', 'expo')
    readonly_fields = ('_preview',)

    @admin.display(description='Miniatura')
    def _preview(self, obj):
        # Mostrem la primera imatge destacada o la primera imatge a seques
        img = obj.imatges.filter(es_destacada=True).first() or obj.imatges.first()
        return img_preview(img.imatge if img else None, size=60)


# ─── Etiqueta ─────────────────────────────────────────────────────────────────

@admin.register(Etiqueta)
class EtiquetaAdmin(admin.ModelAdmin):
    list_display = ('nom', 'pare', 'num_items')
    list_filter = ('pare',)
    search_fields = ('nom',)
    autocomplete_fields = ('pare',)

    @admin.display(description='Nº ítems')
    def num_items(self, obj):
        return obj.items.count()


# ─── Expo ─────────────────────────────────────────────────────────────────────

@admin.register(Expo)
class ExpoAdmin(admin.ModelAdmin):
    list_display = ('nom', 'lloc', 'data_inici', 'data_fi', '_estat_badge', '_portada', 'num_items')
    list_filter = ('estat',)
    search_fields = ('nom', 'lloc')
    date_hierarchy = 'data_inici'
    inlines = [ItemInline]
    readonly_fields = ('_portada_gran',)
    fieldsets = (
        ('Informació general', {
            'fields': ('nom', 'descripcio', 'lloc', 'data_inici', 'data_fi')
        }),
        ('Imatge i estat', {
            'fields': ('imatge', '_portada_gran', 'estat')
        }),
    )

    @admin.display(description='Estat')
    def _estat_badge(self, obj):
        colors = {
            'INIT': '#f59e0b',
            'DISPONIBLE': '#10b981',
            'ACTUALITZABLE': '#f97316',
        }
        color = colors.get(obj.estat, '#6b7280')
        return format_html(
            '<span style="background:{c}; color:#fff; padding:2px 10px;'
            ' border-radius:12px; font-size:11px; font-weight:600;">{t}</span>',
            c=color, t=obj.get_estat_display()
        )

    @admin.display(description='Portada')
    def _portada(self, obj):
        return img_preview(obj.imatge, size=50)

    @admin.display(description='Previsualització portada')
    def _portada_gran(self, obj):
        return img_preview(obj.imatge, size=280)

    @admin.display(description='Nº ítems')
    def num_items(self, obj):
        return obj.items.count()


# ─── Item ─────────────────────────────────────────────────────────────────────

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ('nom', 'expo', '_imatge_preview', 'num_imatges', 'num_intents', 'creat_el')
    list_filter = ('expo', 'etiquetes')
    search_fields = ('nom', 'descripcio')
    inlines = [ImatgeInline, ItemEtiquetaInline, IntentInline]
    fieldsets = (
        ('Informació general', {
            'fields': ('nom', 'descripcio', 'expo')
        }),
    )

    @admin.display(description='Imatges destacades')
    def _imatge_preview(self, obj):
        # Mostrem previsualitzacions de les imatges destacades
        imgs = obj.imatges.filter(es_destacada=True)
        if not imgs:
            imgs = obj.imatges.all()[:1]
        
        previews = [img_preview(img.imatge, size=55) for img in imgs]
        return format_html(" ".join(previews)) if previews else img_preview(None)

    @admin.display(description='Imatges')
    def num_imatges(self, obj):
        return obj.imatges.count()

    @admin.display(description='Intents')
    def num_intents(self, obj):
        return obj.intents.count()


# ─── Imatge ───────────────────────────────────────────────────────────────────

@admin.register(Imatge)
class ImatgeAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'item', 'es_destacada', '_visibilitat', 'ordre', '_preview', 'creat_el')
    list_filter = ('es_publica', 'item__expo')
    search_fields = ('item__nom',)
    readonly_fields = ('_preview_gran',)
    fieldsets = (
        (None, {
            'fields': ('item', 'imatge', '_preview_gran', 'es_destacada', 'es_publica', 'ordre')
        }),
    )

    @admin.display(description='Visible')
    def _visibilitat(self, obj):
        if obj.es_publica:
            return format_html('<span style="color:#10b981; font-weight:600;">🌐 Pública</span>')
        return format_html('<span style="color:#ef4444; font-weight:600;">🔒 Privada (IA)</span>')

    @admin.display(description='Miniatura')
    def _preview(self, obj):
        return img_preview(obj.imatge, size=55)

    @admin.display(description='Previsualització')
    def _preview_gran(self, obj):
        return img_preview(obj.imatge, size=280)


# ─── Intent ───────────────────────────────────────────────────────────────────

@admin.register(Intent)
class IntentAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'item', '_resultat', 'confiança', '_preview', 'creat_el')
    list_filter = ('encert', 'item__expo')
    search_fields = ('item__nom',)
    readonly_fields = ('_preview_gran',)
    fieldsets = (
        (None, {
            'fields': ('item', 'imatge', '_preview_gran', 'encert', 'confiança')
        }),
    )

    @admin.display(description='Resultat')
    def _resultat(self, obj):
        if obj.encert is None:
            return format_html('<span style="color:#6b7280;">⏳ Pendent</span>')
        if obj.encert:
            return format_html('<span style="color:#10b981; font-weight:600;">✓ Encertat</span>')
        return format_html('<span style="color:#ef4444; font-weight:600;">✗ Incorrecte</span>')

    @admin.display(description='Foto')
    def _preview(self, obj):
        return img_preview(obj.imatge, size=55)

    @admin.display(description='Previsualització')
    def _preview_gran(self, obj):
        return img_preview(obj.imatge, size=280)
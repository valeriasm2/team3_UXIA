from django.db import models

class MyModel1(models.Model):
    nombre_coche = models.CharField(max_length=100)
    
    pass
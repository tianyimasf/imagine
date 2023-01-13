from django.db import models

# Create your models here.
class MusicVisualizer(models.Model):
	song = models.FileField()

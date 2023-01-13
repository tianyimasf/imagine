from django import forms

from .models import MusicVisualizer


class MusicVisualizerForm(forms.ModelForm):

    class Meta:
        model = MusicVisualizer
        fields = ['song']
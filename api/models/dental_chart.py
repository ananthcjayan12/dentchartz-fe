class DentalChartTooth(models.Model):
    """Model for a tooth in a dental chart."""
    patient = models.ForeignKey('Patient', on_delete=models.CASCADE)
    number = models.CharField(max_length=10)  # Using CharField to support both numbers and letters
    name = models.CharField(max_length=100)
    quadrant = models.CharField(max_length=20)
    dentition_type = models.CharField(max_length=20, choices=[
        ('permanent', 'Permanent'),
        ('primary', 'Primary')
    ])
    # ... other fields 
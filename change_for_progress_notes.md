here are the suggested changes needed in the backend:
# models/dental_chart.py

class ProcedureNote(models.Model):
    """Model for procedure progress notes."""
    procedure = models.ForeignKey('DentalChartProcedure', on_delete=models.CASCADE, related_name='notes')
    note = models.TextField()
    appointment_date = models.DateTimeField()
    created_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-appointment_date']

class DentalChartProcedure(models.Model):
    # ... existing fields ...
    
    @property
    def progress_notes(self):
        return self.notes.all().values(
            'note',
            'appointment_date',
            'created_by__first_name',
            'created_by__last_name',
            'created_at'
        )

Enhanced Chart History
# models/dental_chart.py

class ChartHistory(models.Model):
    # ... existing fields ...
    
    ACTIONS = [
        ('add_condition', 'Add Condition'),
        ('update_condition', 'Update Condition'),
        ('remove_condition', 'Remove Condition'),
        ('add_procedure', 'Add Procedure'),
        ('update_procedure', 'Update Procedure'),
        ('remove_procedure', 'Remove Procedure'),
        ('add_procedure_note', 'Add Procedure Note'),
    ]
    
    action = models.CharField(max_length=50, choices=ACTIONS)
    category = models.CharField(max_length=50, null=True, blank=True)  # For filtering (conditions/procedures)
    
    class Meta:
        ordering = ['-date']
        indexes = [
            models.Index(fields=['patient', 'tooth_number']),
            models.Index(fields=['patient', 'category']),
            models.Index(fields=['patient', 'date'])
        ]
    
    # views/dental_chart.py

    # views/dental_chart.py

class DentalChartViewSet(ClinicViewSetMixin, GenericViewSet):
    # ... existing methods ...
    
    @action(detail=True, methods=['post'], 
            url_path='tooth/(?P<tooth_number>[A-Za-z0-9]+)/procedure/(?P<procedure_id>[0-9]+)/notes')
    def add_procedure_note(self, request, clinic_id=None, patient_id=None, 
                          tooth_number=None, procedure_id=None):
        """Add a progress note to a procedure."""
        clinic = self.get_clinic_from_url()
        patient = get_object_or_404(Patient, id=patient_id, clinic=clinic)
        tooth = get_object_or_404(DentalChartTooth, patient=patient, number=str(tooth_number))
        procedure = get_object_or_404(DentalChartProcedure, id=procedure_id, tooth=tooth)
        
        note = ProcedureNote.objects.create(
            procedure=procedure,
            note=request.data['note'],
            appointment_date=request.data['appointment_date'],
            created_by=request.user
        )
        
        # Create history entry
        ChartHistory.objects.create(
            patient=patient,
            user=request.user,
            action='add_procedure_note',
            tooth_number=str(tooth_number),
            category='procedures',
            details={
                'procedure_name': procedure.procedure.name,
                'note': note.note,
                'appointment_date': note.appointment_date.strftime('%Y-%m-%d %H:%M'),
                'status': procedure.status
            }
        )
        
        return Response(ProcedureNoteSerializer(note).data, 
                       status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='history')
    def get_chart_history(self, request, clinic_id=None, patient_id=None):
        """Get dental chart history with filtering options."""
        clinic = self.get_clinic_from_url()
        patient = get_object_or_404(Patient, id=patient_id, clinic=clinic)
        
        # Filter parameters
        tooth_number = request.query_params.get('tooth_number')
        category = request.query_params.get('category')  # 'conditions' or 'procedures'
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        history = ChartHistory.objects.filter(patient=patient)
        
        if tooth_number:
            history = history.filter(tooth_number=tooth_number)
        if category:
            history = history.filter(category=category)
        if start_date:
            history = history.filter(date__gte=start_date)
        if end_date:
            history = history.filter(date__lte=end_date)
        
        return Response(ChartHistorySerializer(history, many=True).data)



# serializers/dental_chart.py

# serializers/dental_chart.py

class ProcedureNoteSerializer(serializers.ModelSerializer):
    created_by = serializers.SerializerMethodField()
    
    class Meta:
        model = ProcedureNote
        fields = ['id', 'note', 'appointment_date', 'created_by', 'created_at']
    
    def get_created_by(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

class DentalChartProcedureSerializer(serializers.ModelSerializer):
    # ... existing fields ...
    progress_notes = ProcedureNoteSerializer(many=True, read_only=True)
    
    class Meta:
        model = DentalChartProcedure
        fields = [...existing_fields..., 'progress_notes']

class ChartHistorySerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source='get_action_display')
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ChartHistory
        fields = ['id', 'date', 'action', 'action_display', 'tooth_number', 
                 'category', 'details', 'user_name']
    
    def get_user_name(self, obj):
        return obj.user.get_full_name() or obj.user.username



# urls.py

urlpatterns = [
    # ... existing urls ...
    path('dental-chart/<int:patient_id>/history/', 
         DentalChartViewSet.as_view({'get': 'get_chart_history'})),
    path('dental-chart/tooth/<str:tooth_number>/procedure/<int:procedure_id>/notes/',
         DentalChartViewSet.as_view({'post': 'add_procedure_note'})),
]
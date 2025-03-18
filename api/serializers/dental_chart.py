from rest_framework import serializers
from api.models.dental_chart import (
    DentalChartTooth, DentalChartCondition, DentalChartProcedure
)
# Make sure to import your actual model classes and User model as needed

class DentalChartConditionSerializer(serializers.ModelSerializer):
    # These fields pull in related data from the dental condition
    condition_name = serializers.CharField(source='condition.name', read_only=True)
    condition_code = serializers.CharField(source='condition.code', read_only=True)
    created_by = serializers.SerializerMethodField()
    updated_by = serializers.SerializerMethodField()

    def get_created_by(self, obj):
        return obj.created_by.get_full_name() if obj.created_by else ""
    
    def get_updated_by(self, obj):
        return obj.updated_by.get_full_name() if obj.updated_by else ""
    
    class Meta:
        model = DentalChartCondition
        fields = [
            'id',
            'condition_id',
            'condition_name',
            'condition_code',
            'surface',
            'notes',
            'severity',
            'created_at',
            'updated_at',
            'created_by',
            'updated_by',
        ]

class DentalChartProcedureSerializer(serializers.ModelSerializer):
    procedure_name = serializers.CharField(source='procedure.name', read_only=True)
    procedure_code = serializers.CharField(source='procedure.code', read_only=True)
    performed_by = serializers.SerializerMethodField()

    def get_performed_by(self, obj):
        return obj.performed_by.get_full_name() if obj.performed_by else ""
    
    class Meta:
        model = DentalChartProcedure
        fields = [
            'id',
            'procedure_name',
            'procedure_code',
            'surface',
            'notes',
            'date_performed',
            'price',
            'status',
            'performed_by',
        ]

class DentalChartToothSerializer(serializers.ModelSerializer):
    # Add related conditions and procedures to each tooth
    conditions = DentalChartConditionSerializer(many=True, read_only=True)
    procedures = DentalChartProcedureSerializer(many=True, read_only=True)

    class Meta:
        model = DentalChartTooth
        fields = [
            'id',
            'number',
            'universal_number',
            'dentition_type',
            'name',
            'quadrant',
            'conditions',     # <-- Newly added
            'procedures',     # <-- Newly added
        ] 
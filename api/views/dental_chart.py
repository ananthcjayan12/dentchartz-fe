from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status

class DentalChartView(APIView):
    def add_tooth_condition(self, request, clinic_id=None, patient_id=None, tooth_number=None):
        """Add a condition to a tooth."""
        clinic = self.get_clinic_from_url()
        patient = get_object_or_404(Patient, id=patient_id, clinic=clinic)
        
        # Validate dentition_type matches tooth number format
        dentition_type = request.data.get('dentition_type')
        is_primary = tooth_number.isalpha()
        if (is_primary and dentition_type != 'primary') or (not is_primary and dentition_type != 'permanent'):
            return Response(
                {'dentition_type': 'Dentition type must match tooth number format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure the patient has teeth records
        self._ensure_patient_has_teeth(patient)
        
        # Get the tooth
        tooth = get_object_or_404(DentalChartTooth, patient=patient, number=str(tooth_number))
        
        # Rest of your existing code... 
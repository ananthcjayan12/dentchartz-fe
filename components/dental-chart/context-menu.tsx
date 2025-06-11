import React from 'react';
import { Tooth, ToothCondition, ToothProcedure } from '@/services/dental-chart.service';
import { Edit, Trash2, Plus, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  onClose: () => void;
  onAddCondition: () => void;
  onAddProcedure: () => void;
  selectedTeeth: Tooth[];
  onEditCondition?: (tooth: Tooth, condition: ToothCondition) => void;
  onDeleteCondition?: (tooth: Tooth, condition: ToothCondition) => void;
  onEditProcedure?: (tooth: Tooth, procedure: ToothProcedure) => void;
  onDeleteProcedure?: (tooth: Tooth, procedure: ToothProcedure) => void;
}

export function ContextMenu({
  x,
  y,
  isVisible,
  onClose,
  onAddCondition,
  onAddProcedure,
  selectedTeeth,
  onEditCondition,
  onDeleteCondition,
  onEditProcedure,
  onDeleteProcedure
}: ContextMenuProps) {
  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Get all existing conditions and procedures from selected teeth
  const allConditions: Array<{tooth: Tooth, condition: ToothCondition}> = [];
  const allProcedures: Array<{tooth: Tooth, procedure: ToothProcedure}> = [];

  selectedTeeth.forEach(tooth => {
    tooth.conditions?.forEach(condition => {
      allConditions.push({ tooth, condition });
    });
    tooth.procedures?.forEach(procedure => {
      allProcedures.push({ tooth, procedure });
    });
  });

  const hasExistingItems = allConditions.length > 0 || allProcedures.length > 0;
  const isSingleTooth = selectedTeeth.length === 1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleBackdropClick}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[200px] max-w-[300px] max-h-[400px] overflow-y-auto"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100 mb-1">
          {selectedTeeth.length} tooth{selectedTeeth.length !== 1 ? 's' : ''} selected
          {isSingleTooth && selectedTeeth[0] && (
            <span className="ml-1 font-medium">#{selectedTeeth[0].number}</span>
          )}
        </div>
        
        {/* Add New Section */}
        <div className="py-1">
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
            onClick={() => {
              onAddCondition();
              onClose();
            }}
          >
            <Plus className="w-4 h-4 text-green-500" />
            Add New Condition
          </button>
          
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
            onClick={() => {
              onAddProcedure();
              onClose();
            }}
          >
            <Plus className="w-4 h-4 text-green-500" />
            Add New Procedure
          </button>
        </div>

        {/* Existing Items Section */}
        {hasExistingItems && (
          <>
            <Separator className="my-1" />
            
            {/* Existing Conditions */}
            {allConditions.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                  Existing Conditions ({allConditions.length})
                </div>
                {allConditions.map(({ tooth, condition }, index) => (
                  <div key={`${tooth.number}-${condition.id}-${index}`} className="px-3 py-1">
                    <div className="text-xs text-gray-500 mb-1">
                      Tooth #{tooth.number} • {condition.condition_name}
                      {condition.surface && ` • ${condition.surface}`}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          console.log('Edit condition button clicked:', { tooth, condition });
                          console.log('onEditCondition function:', onEditCondition);
                          console.log('Calling onEditCondition with params:', { tooth, condition });
                          if (onEditCondition) {
                            onEditCondition(tooth, condition);
                          } else {
                            console.warn('onEditCondition is not defined');
                          }
                          onClose();
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          console.log('Delete condition button clicked:', { tooth, condition });
                          console.log('onDeleteCondition function:', onDeleteCondition);
                          console.log('Calling onDeleteCondition with params:', { tooth, condition });
                          if (onDeleteCondition) {
                            onDeleteCondition(tooth, condition);
                          } else {
                            console.warn('onDeleteCondition is not defined');
                          }
                          onClose();
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Existing Procedures */}
            {allProcedures.length > 0 && (
              <div className="py-1">
                <div className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50">
                  Existing Procedures ({allProcedures.length})
                </div>
                {allProcedures.map(({ tooth, procedure }, index) => (
                  <div key={`${tooth.number}-${procedure.id}-${index}`} className="px-3 py-1">
                    <div className="text-xs text-gray-500 mb-1">
                      Tooth #{tooth.number} • {procedure.procedure_name}
                      {procedure.surface && ` • ${procedure.surface}`}
                      {procedure.status && (
                        <span className={`ml-1 px-1 rounded text-xs ${
                          procedure.status === 'completed' ? 'bg-green-100 text-green-700' :
                          procedure.status === 'planned' ? 'bg-yellow-100 text-yellow-700' :
                          procedure.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {procedure.status}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          console.log('Edit procedure button clicked:', { tooth, procedure });
                          console.log('onEditProcedure function:', onEditProcedure);
                          console.log('Calling onEditProcedure with params:', { tooth, procedure });
                          if (onEditProcedure) {
                            onEditProcedure(tooth, procedure);
                          } else {
                            console.warn('onEditProcedure is not defined');
                          }
                          onClose();
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          console.log('Delete procedure button clicked:', { tooth, procedure });
                          console.log('onDeleteProcedure function:', onDeleteProcedure);
                          console.log('Calling onDeleteProcedure with params:', { tooth, procedure });
                          if (onDeleteProcedure) {
                            onDeleteProcedure(tooth, procedure);
                          } else {
                            console.warn('onDeleteProcedure is not defined');
                          }
                          onClose();
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Help Text */}
        {!hasExistingItems && (
          <div className="px-3 py-2 text-xs text-gray-400 border-t border-gray-100 mt-1">
            No existing conditions or procedures on selected {selectedTeeth.length === 1 ? 'tooth' : 'teeth'}
          </div>
        )}
      </div>
    </>
  );
} 
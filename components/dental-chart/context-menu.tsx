import React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  onClose: () => void;
  onAddCondition: () => void;
  onAddProcedure: () => void;
  selectedTeethCount: number;
}

export function ContextMenu({
  x,
  y,
  isVisible,
  onClose,
  onAddCondition,
  onAddProcedure,
  selectedTeethCount
}: ContextMenuProps) {
  if (!isVisible) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleBackdropClick}
      />
      
      {/* Context Menu */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px]"
        style={{
          left: `${x}px`,
          top: `${y}px`,
        }}
      >
        <div className="px-3 py-1 text-xs text-gray-500 border-b border-gray-100 mb-1">
          {selectedTeethCount} tooth{selectedTeethCount !== 1 ? 's' : ''} selected
        </div>
        
        <button
          className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
          onClick={() => {
            onAddCondition();
            onClose();
          }}
        >
          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
          Add Condition
        </button>
        
        <button
          className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 flex items-center gap-2"
          onClick={() => {
            onAddProcedure();
            onClose();
          }}
        >
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Add Procedure
        </button>
      </div>
    </>
  );
} 
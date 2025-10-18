import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Calendar, Activity, TrendingUp, AlertTriangle } from 'lucide-react';


export const getStatusColor = (status) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50';
    case 'infected':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
};


const TreeDetailModal = ({ tree, isOpen, onClose }) => {
  if (!tree) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getYieldColor = (yieldValue) => {
    if (yieldValue >= 0) return 'text-green-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-800">
            Tree {tree.name} Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="text-green-600" size={20} />
                <h3 className="font-semibold text-green-800">Date Planted</h3>
              </div>
              <p className="text-green-700">{formatDate(tree.datePlanted)}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="text-blue-600" size={20} />
                <h3 className="font-semibold text-blue-800">Yield Prediction</h3>
              </div>
              <p
                className={`text-2xl font-bold ${getYieldColor(
                  tree.yieldPrediction
                )}`}
              >
                {tree.yieldPrediction}%
              </p>
            </div>
          </div>

          {/* Current Status */}
          {/* Black Sigatoka Status + Last Update */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
             <AlertTriangle className="text-gray-600" size={20} />
              <h3 className="font-semibold text-gray-800">Black Sigatoka Status</h3>
          </div>

        {/* Last Update - fetched from DB */}
        <div className="flex items-center gap-1">
          <span className="text-gray-500 font-semibold text-sm">Last Update:</span>
          <span className="text-gray-500 font-medium text-sm">
          {tree.date
          ? new Date(tree.date).toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "N/A"}
          </span>
         </div>
        </div>

  <Badge
    className={`${getStatusColor(tree.blackSigatokaInfection)} text-sm px-3 py-1`}
  >
    {tree.blackSigatokaInfection.toUpperCase()}
  </Badge>
</div>


          {/* Detection History */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="text-gray-600" size={20} />
              <h3 className="font-semibold text-gray-800">Detection History</h3>
            </div>

            <div className="space-y-3">
              {tree.detectionHistory && tree.detectionHistory.length > 0 ? (
                tree.detectionHistory.map((record, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {formatDate(record.date)}
                      </span>
                      <Badge
                        className={`${getStatusColor(record.status)} text-xs`}
                      >
                        {record.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Yield: {record.Yield}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 italic text-sm">
                  No detection history available
                </p>
              )}
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(
                  (Date.now() - new Date(tree.datePlanted)) /
                    (1000 * 60 * 60 * 24)
                )}
              </div>
              <div className="text-sm text-green-700">Days Old</div>
            </div>

            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {tree.position.row}x{tree.position.col}
              </div>
              <div className="text-sm text-blue-700">Grid Position</div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {tree.detectionHistory.length}
              </div>
              <div className="text-sm text-purple-700">Inspections</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TreeDetailModal;

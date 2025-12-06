import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Calendar, Activity, TrendingUp, AlertTriangle, MapPin, Clock, Eye, Image, Loader2 } from 'lucide-react';
import { API_BASE } from "../config";
import ImageModal from './ImageModal';

export const getStatusColor = (status) => {
  switch (status) {
    case 'healthy':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'infected':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

const TreeDetailModal = ({ tree, isOpen, onClose }) => {
  const [showImages, setShowImages] = useState(false);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Reset when parent modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowImages(false);
      setImages([]);
    }
  }, [isOpen]);

  if (!tree) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getYieldColor = (yieldValue) => {
    if (yieldValue >= 75) return 'text-green-600';
    if (yieldValue >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getYieldBgColor = (yieldValue) => {
    if (yieldValue >= 75) return 'bg-green-50 border-green-200';
    if (yieldValue >= 50) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const formatCoordinate = (coord) => {
    return typeof coord === 'number' ? coord.toFixed(6) : 'N/A';
  };

  const daysOld = Math.floor(
    (Date.now() - new Date(tree.datePlanted)) / (1000 * 60 * 60 * 24)
  );

  const fetchImages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/plantations/${tree.id}/images`);
      const data = await response.json();
      
      console.log(`Fetched ${data.images?.length || 0} images for Tree ${tree.name} (ID: ${tree.id})`);
      
      setImages(data.images || []);
      setShowImages(true);
    } catch (error) {
      console.error('Error fetching images:', error);
      alert('Failed to load images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleParentClose = (open) => {
    if (!open) {
      if (showImages) {
        return;
      }
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleParentClose}>
        <DialogContent 
          className="w-[98%] sm:w-[95%] md:w-[90%] lg:max-w-3xl xl:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6"
          onInteractOutside={(e) => {
            if (showImages) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader className="border-b border-green-200 pb-3 sm:pb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-green-600 text-white rounded-full p-2 sm:p-3">
                <Activity size={20} className="sm:w-6 sm:h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-green-800">
                  Tree {tree.name}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">Detailed Health Report</p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-5 mt-3 sm:mt-4">
            {/* Status Banner */}
            <div className={`p-3 sm:p-4 rounded-xl border-2 ${getStatusColor(tree.blackSigatokaInfection)} shadow-sm`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <AlertTriangle size={20} className={`mt-0.5 sm:mt-0 flex-shrink-0 sm:w-6 sm:h-6 ${tree.blackSigatokaInfection === 'infected' ? 'text-red-600' : 'text-green-600'}`} />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base sm:text-lg break-words">
                      Status: {tree.blackSigatokaInfection.toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                      <Clock size={12} className="text-gray-500 flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                      <span className="text-xs sm:text-sm text-gray-600">
                        Last checked: {tree.date ? formatDate(tree.date) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={`${getStatusColor(tree.blackSigatokaInfection)} text-sm sm:text-base px-3 sm:px-4 py-1.5 sm:py-2 font-semibold border whitespace-nowrap`}>
                  {tree.blackSigatokaInfection === 'infected' ? '⚠️ INFECTED' : '✓ HEALTHY'}
                </Badge>
              </div>
            </div>

            {/* See Photos Button */}
          
            <button
              onClick={fetchImages}
              disabled={loading}
              className="ml-auto px-2 py-2 sm:px-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base rounded-lg font-medium flex items-center justify-center gap-1 sm:gap-3 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">Loading Photos...</span>
                </>
              ) : (
                <>
                  <Image size={20} className="sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">See Photos</span>
                </>
              )}
            </button>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
              {/* Date Planted */}
              <div className="bg-white border-2 border-green-200 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="bg-green-100 rounded-lg p-1.5 sm:p-2">
                    <Calendar className="text-green-600" size={16} />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Date Planted</h3>
                </div>
                <p className="text-green-700 font-medium text-sm sm:text-base">{formatDate(tree.datePlanted)}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">{daysOld} days old</p>
              </div>

              {/* Yield Prediction */}
              <div className={`border-2 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow ${getYieldBgColor(tree.yieldPrediction)}`}>
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className={`${getYieldColor(tree.yieldPrediction) === 'text-green-600' ? 'bg-green-100' : getYieldColor(tree.yieldPrediction) === 'text-yellow-600' ? 'bg-yellow-100' : 'bg-red-100'} rounded-lg p-1.5 sm:p-2`}>
                    <TrendingUp className={getYieldColor(tree.yieldPrediction)} size={16} />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Yield Prediction</h3>
                </div>
                <p className={`text-2xl sm:text-3xl font-bold ${getYieldColor(tree.yieldPrediction)}`}>
                  {tree.yieldPrediction}%
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Expected harvest time</p>
              </div>

              {/* Location */}
              <div className="bg-white border-2 border-blue-200 p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="bg-blue-100 rounded-lg p-1.5 sm:p-2">
                    <MapPin className="text-blue-600" size={16} />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base">Location</h3>
                </div>
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-mono text-blue-700 break-all">
                    Lat: {formatCoordinate(tree.position?.lat)}
                  </p>
                  <p className="text-xs sm:text-sm font-mono text-blue-700 break-all">
                    Lon: {formatCoordinate(tree.position?.lon)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-3 sm:p-4 rounded-lg shadow-md text-center">
                <div className="text-2xl sm:text-3xl font-bold">{daysOld}</div>
                <div className="text-xs sm:text-sm opacity-90 mt-1">Days Old</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-3 sm:p-4 rounded-lg shadow-md text-center">
                <div className="text-2xl sm:text-3xl font-bold">{tree.detectionHistory?.length || 0}</div>
                <div className="text-xs sm:text-sm opacity-90 mt-1 flex items-center justify-center gap-1">
                  <Eye size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline">Inspections</span>
                  <span className="xs:hidden">Checks</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 sm:p-4 rounded-lg shadow-md text-center">
                <div className="text-2xl sm:text-3xl font-bold">
                  {tree.detectionHistory?.filter(h => h.status === 'healthy').length || 0}
                </div>
                <div className="text-xs sm:text-sm opacity-90 mt-1">Healthy</div>
              </div>
            </div>

            {/* Detection History */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <div className="bg-gray-100 rounded-lg p-1.5 sm:p-2">
                  <Activity className="text-gray-600" size={16} />
                </div>
                <h3 className="font-bold text-gray-800 text-base sm:text-lg">Detection History</h3>
              </div>

              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                {tree.detectionHistory && tree.detectionHistory.length > 0 ? (
                  tree.detectionHistory.map((record, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[auto_1px_1fr_auto] items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      {/* Date Column */}
                      <div className="text-center">
                        <div className="text-xs text-gray-500 uppercase font-medium">
                          {new Date(record.date).toLocaleDateString('en-PH', { month: 'short' })}
                        </div>
                        <div className="text-lg sm:text-xl font-bold text-gray-800">
                          {new Date(record.date).getDate()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(record.date).getFullYear()}
                        </div>
                      </div>
                      
                      {/* Divider */}
                      <div className="h-12 bg-gray-300"></div>
                      
                      {/* Status Badge Column */}
                      <Badge className={`${getStatusColor(record.status)} text-xs sm:text-sm px-2 sm:px-3 py-1 border font-medium whitespace-nowrap justify-self-start`}>
                        {record.status === 'infected' ? '⚠️' : '✓'} {record.status.toUpperCase()}
                      </Badge>
                      
                      {/* Yield Column - Always Right */}
                      <div className="text-right">
                        <div className={`text-xl sm:text-2xl font-bold ${getYieldColor(record.Yield)}`}>
                          {record.Yield}%
                        </div>
                        <div className="text-xs text-gray-500">Yield</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 sm:py-8">
                    <Activity size={32} className="mx-auto text-gray-300 mb-2 sm:w-10 sm:h-10" />
                    <p className="text-gray-500 italic text-sm">No detection history available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <ImageModal 
        tree={tree}
        images={images}
        isOpen={showImages}
        onClose={() => setShowImages(false)}
      />
    </>
  );
};

export default TreeDetailModal;
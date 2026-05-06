import React from 'react';
import WebcamDetector from '../WebcamDetector/WebcamDetector';

const DetectionPanel = () => {
  return (
    <div className="space-y-6">
      <WebcamDetector />
      
      {/* Additional detection information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detection Sensitivity
            </label>
            <input
              type="range"
              min="1"
              max="100"
              defaultValue="75"
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alert Threshold
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>High (Immediate Alert)</option>
              <option>Medium (After 5 seconds)</option>
              <option>Low (After 10 seconds)</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Save Settings
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetectionPanel;
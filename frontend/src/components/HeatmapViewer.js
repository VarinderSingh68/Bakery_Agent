import React, { useState, useEffect, useRef } from 'react';
import { Activity, MousePointer, Eye } from 'lucide-react';
import analytics from '../services/analytics';

export const HeatmapViewer = () => {
  const canvasRef = useRef(null);
  const [heatmapData, setHeatmapData] = useState(null);
  const [view, setView] = useState('clicks'); // 'clicks' or 'movements'

  useEffect(() => {
    loadHeatmapData();
    
    // Update every 5 seconds
    const interval = setInterval(loadHeatmapData, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (heatmapData && canvasRef.current) {
      drawHeatmap();
    }
  }, [heatmapData, view]);

  const loadHeatmapData = () => {
    const data = analytics.getHeatmapData();
    setHeatmapData(data);
  };

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (view === 'clicks') {
      // Draw click heatmap
      heatmapData.clicks.forEach(click => {
        const gradient = ctx.createRadialGradient(
          click.x, click.y, 0,
          click.x, click.y, 30
        );
        gradient.addColorStop(0, 'rgba(194, 89, 52, 0.6)');
        gradient.addColorStop(1, 'rgba(194, 89, 52, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(click.x - 30, click.y - 30, 60, 60);
      });
    }

    // Draw scroll depth indicator
    const scrollY = (heatmapData.scrollDepth / 100) * canvas.height;
    ctx.strokeStyle = '#4A6B53';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, scrollY);
    ctx.lineTo(canvas.width, scrollY);
    ctx.stroke();
  };

  const sessionRecording = analytics.getSessionRecording();

  return (
    <div className="space-y-6" data-testid="heatmap-viewer">
      <div>
        <h3 className="text-xl font-['Playfair_Display'] font-bold text-[#2D241E] mb-4">
          Session Recording & Heatmaps
        </h3>
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <Activity size={24} className="text-blue-600" />
              <span className="text-xs text-blue-600 font-semibold">SESSION</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {Math.floor(sessionRecording.duration / 1000)}s
            </p>
            <p className="text-sm text-blue-700">Session Duration</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <MousePointer size={24} className="text-purple-600" />
              <span className="text-xs text-purple-600 font-semibold">MOVES</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {sessionRecording.mouseMovements.length}
            </p>
            <p className="text-sm text-purple-700">Mouse Movements</p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center justify-between mb-2">
              <MousePointer size={24} className="text-pink-600" />
              <span className="text-xs text-pink-600 font-semibold">CLICKS</span>
            </div>
            <p className="text-2xl font-bold text-pink-900">
              {sessionRecording.clicks.length}
            </p>
            <p className="text-sm text-pink-700">Total Clicks</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <Eye size={24} className="text-green-600" />
              <span className="text-xs text-green-600 font-semibold">SCROLL</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {heatmapData?.scrollDepth || 0}%
            </p>
            <p className="text-sm text-green-700">Scroll Depth</p>
          </div>
        </div>

        {/* Heatmap View Selector */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setView('clicks')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              view === 'clicks'
                ? 'bg-[#C25934] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Click Heatmap
          </button>
          <button
            onClick={() => setView('movements')}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              view === 'movements'
                ? 'bg-[#C25934] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Mouse Movements
          </button>
        </div>

        {/* Heatmap Canvas */}
        <div className="relative bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 overflow-hidden" style={{ height: '400px' }}>
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ mixBlendMode: 'multiply' }}
          />
          {heatmapData?.clicks.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-400">No interaction data yet. Start clicking around!</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-2">Legend:</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded-full bg-[#C25934]/60"></div>
              <span className="text-sm text-gray-600">Click intensity</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-0.5 bg-[#4A6B53] border-dashed"></div>
              <span className="text-sm text-gray-600">Max scroll depth</span>
            </div>
          </div>
        </div>

        {/* Note */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Session recording data is stored locally. In production, integrate with services like Hotjar, FullStory, or LogRocket for complete session replay and heatmap analytics.
          </p>
        </div>
      </div>
    </div>
  );
};

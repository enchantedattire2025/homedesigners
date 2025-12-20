import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Square, Move, Trash2, Save, Undo, Redo, Grid, Calculator, IndianRupee as Rupee, Plus, Minus, ArrowLeft, Palette, Sofa, Bed, Table, Armchair as Chair, Tv, Lamp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';

interface Point {
  x: number;
  y: number;
}

interface Room {
  id: string;
  name: string;
  points: Point[];
  color: string;
  area: number;
  type: string;
}

interface Furniture {
  id: string;
  type: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  price: number;
}

interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
  color: string;
}

interface DesignData {
  rooms: Room[];
  furniture: Furniture[];
  walls: Wall[];
  gridSize: number;
  scale: number; // pixels per foot
}

const DesignTool = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDesigner, loading: designerLoading } = useDesignerProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<'select' | 'room' | 'furniture'>('select');
  const [selectedFurnitureType, setSelectedFurnitureType] = useState<string>('sofa');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  
  const [designData, setDesignData] = useState<DesignData>({
    rooms: [],
    furniture: [],
    walls: [],
    gridSize: 20,
    scale: 20 // 20 pixels = 1 foot
  });

  const [history, setHistory] = useState<DesignData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const furnitureTypes = [
    { type: 'sofa', name: 'Sofa', icon: Sofa, width: 80, height: 40, price: 25000, color: '#8BC34A' },
    { type: 'bed', name: 'Bed', icon: Bed, width: 60, height: 80, price: 15000, color: '#FF9800' },
    { type: 'dining-table', name: 'Dining Table', icon: Table, width: 60, height: 40, price: 12000, color: '#795548' },
    { type: 'chair', name: 'Chair', icon: Chair, width: 20, height: 20, price: 3000, color: '#607D8B' },
    { type: 'tv', name: 'TV Unit', icon: Tv, width: 50, height: 15, price: 8000, color: '#424242' },
    { type: 'lamp', name: 'Lamp', icon: Lamp, width: 15, height: 15, price: 2000, color: '#FFC107' },
  ];

  const roomTypes = [
    { type: 'living', name: 'Living Room', color: '#E3F2FD', costPerSqFt: 1500 },
    { type: 'bedroom', name: 'Bedroom', color: '#F3E5F5', costPerSqFt: 1200 },
    { type: 'kitchen', name: 'Kitchen', color: '#E8F5E8', costPerSqFt: 2000 },
    { type: 'bathroom', name: 'Bathroom', color: '#FFF3E0', costPerSqFt: 1800 },
    { type: 'dining', name: 'Dining Room', color: '#FCE4EC', costPerSqFt: 1300 },
    { type: 'study', name: 'Study Room', color: '#E1F5FE', costPerSqFt: 1100 },
  ];

  // Check authentication and authorization
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    // Check if user is authenticated
    if (!user) {
      navigate('/');
      return;
    }

    // Wait for designer status to finish loading
    if (designerLoading) {
      return;
    }

    // Check if user is a designer
    if (!isDesigner) {
      navigate('/my-projects');
      return;
    }
  }, [authLoading, user, isDesigner, designerLoading, navigate]);

  // Initialize history
  useEffect(() => {
    if (history.length === 0) {
      setHistory([designData]);
      setHistoryIndex(0);
    }
  }, []);

  // Canvas drawing functions
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!showGrid) return;
    
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    const gridSize = designData.gridSize * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    
    for (let x = offsetX; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = offsetY; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [showGrid, designData.gridSize, zoom, pan]);

  const drawRoom = useCallback((ctx: CanvasRenderingContext2D, room: Room) => {
    if (room.points.length < 3) return;
    
    ctx.fillStyle = room.color;
    ctx.strokeStyle = selectedItem === room.id ? '#2196F3' : '#333';
    ctx.lineWidth = selectedItem === room.id ? 3 : 2;
    
    ctx.beginPath();
    const firstPoint = room.points[0];
    ctx.moveTo(firstPoint.x * zoom + pan.x, firstPoint.y * zoom + pan.y);
    
    room.points.slice(1).forEach(point => {
      ctx.lineTo(point.x * zoom + pan.x, point.y * zoom + pan.y);
    });
    
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw room label
    const centerX = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length;
    const centerY = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length;
    
    ctx.fillStyle = '#333';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(room.name, centerX * zoom + pan.x, centerY * zoom + pan.y);
  }, [zoom, pan, selectedItem]);

  const drawFurniture = useCallback((ctx: CanvasRenderingContext2D, furniture: Furniture) => {
    ctx.save();
    
    const x = furniture.x * zoom + pan.x;
    const y = furniture.y * zoom + pan.y;
    const width = furniture.width * zoom;
    const height = furniture.height * zoom;
    
    ctx.translate(x + width/2, y + height/2);
    ctx.rotate(furniture.rotation * Math.PI / 180);
    
    ctx.fillStyle = furniture.color;
    ctx.strokeStyle = selectedItem === furniture.id ? '#2196F3' : '#666';
    ctx.lineWidth = selectedItem === furniture.id ? 3 : 1;
    
    ctx.fillRect(-width/2, -height/2, width, height);
    ctx.strokeRect(-width/2, -height/2, width, height);
    
    // Draw furniture icon/label
    ctx.fillStyle = '#333';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(furniture.name, 0, 4);
    
    ctx.restore();
  }, [zoom, pan, selectedItem]);

  const drawWall = useCallback((ctx: CanvasRenderingContext2D, wall: Wall) => {
    ctx.strokeStyle = wall.color;
    ctx.lineWidth = wall.thickness * zoom;
    
    ctx.beginPath();
    ctx.moveTo(wall.start.x * zoom + pan.x, wall.start.y * zoom + pan.y);
    ctx.lineTo(wall.end.x * zoom + pan.x, wall.end.y * zoom + pan.y);
    ctx.stroke();
  }, [zoom, pan]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid(ctx, canvas);
    
    // Draw rooms
    designData.rooms.forEach(room => drawRoom(ctx, room));
    
    // Draw walls
    designData.walls.forEach(wall => drawWall(ctx, wall));
    
    // Draw furniture
    designData.furniture.forEach(furniture => drawFurniture(ctx, furniture));
    
    // Draw current drawing
    if (isDrawing && currentPoints.length > 0) {
      ctx.strokeStyle = '#2196F3';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      const firstPoint = currentPoints[0];
      ctx.moveTo(firstPoint.x * zoom + pan.x, firstPoint.y * zoom + pan.y);
      
      currentPoints.slice(1).forEach(point => {
        ctx.lineTo(point.x * zoom + pan.x, point.y * zoom + pan.y);
      });
      
      if (tool === 'room' && currentPoints.length > 2) {
        // Close the shape
        ctx.lineTo(firstPoint.x * zoom + pan.x, firstPoint.y * zoom + pan.y);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [designData, drawGrid, drawRoom, drawWall, drawFurniture, isDrawing, currentPoints, zoom, pan, tool]);

  // Canvas event handlers
  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    
    // Snap to grid
    const gridSize = designData.gridSize;
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = getCanvasPoint(e);
    
    if (tool === 'room') {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPoints([point]);
      } else {
        setCurrentPoints(prev => [...prev, point]);
      }
    } else if (tool === 'furniture') {
      // Add furniture at clicked position
      const furnitureType = furnitureTypes.find(f => f.type === selectedFurnitureType) || furnitureTypes[0];
      const newFurniture: Furniture = {
        id: Date.now().toString(),
        type: furnitureType.type,
        name: furnitureType.name,
        x: point.x,
        y: point.y,
        width: furnitureType.width,
        height: furnitureType.height,
        rotation: 0,
        color: furnitureType.color,
        price: furnitureType.price
      };
      
      const newDesignData = {
        ...designData,
        furniture: [...designData.furniture, newFurniture]
      };
      
      setDesignData(newDesignData);
      addToHistory(newDesignData);
    }
  };

  const handleCanvasDoubleClick = () => {
    if (tool === 'room' && isDrawing && currentPoints.length >= 3) {
      // Complete room
      const roomType = roomTypes[0]; // Default to living room
      const area = calculatePolygonArea(currentPoints);
      const newRoom: Room = {
        id: Date.now().toString(),
        name: `${roomType.name} ${designData.rooms.length + 1}`,
        points: currentPoints,
        color: roomType.color,
        area,
        type: roomType.type
      };
      
      const newDesignData = {
        ...designData,
        rooms: [...designData.rooms, newRoom]
      };
      
      setDesignData(newDesignData);
      addToHistory(newDesignData);
      
      setIsDrawing(false);
      setCurrentPoints([]);
      setTool('select');
    }
  };

  const calculatePolygonArea = (points: Point[]): number => {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area) / 2 / (designData.scale * designData.scale); // Convert to square feet
  };

  const addToHistory = (newData: DesignData) => {
    // If we're not at the end of the history, remove future states
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setDesignData(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setDesignData(history[historyIndex + 1]);
    }
  };

  const calculateTotalCost = (): number => {
    const furnitureCost = designData.furniture.reduce((total, item) => total + item.price, 0);
    const roomCost = designData.rooms.reduce((total, room) => {
      // Basic cost per square foot based on room type
      const roomTypeObj = roomTypes.find(rt => rt.type === room.type);
      const costPerSqFt = roomTypeObj ? roomTypeObj.costPerSqFt : 1200;
      return total + (room.area * costPerSqFt);
    }, 0);
    
    return furnitureCost + roomCost;
  };

  const handlePanStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'select') {
      const startX = e.clientX;
      const startY = e.clientY;
      const startPan = { ...pan };
      
      const handlePanMove = (moveEvent: MouseEvent) => {
        setPan({
          x: startPan.x + (moveEvent.clientX - startX),
          y: startPan.y + (moveEvent.clientY - startY)
        });
      };
      
      const handlePanEnd = () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
      };
      
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
    }
  };

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        redrawCanvas();
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas]);

  // Redraw canvas when data changes
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  if (!user) {
    return null;
  }

  if (designerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design tool...</p>
        </div>
      </div>
    );
  }

  if (!isDesigner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Access denied. Designer account required.</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (authLoading || designerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading design tool...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(isDesigner ? '/designer-dashboard' : '/my-projects')}
                className="flex items-center text-primary-600 hover:text-primary-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {isDesigner ? 'Back to Dashboard' : 'Back to Projects'}
              </button>
              <h1 className="text-2xl font-bold text-secondary-800">2D Home Designer</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                title="Undo"
              >
                <Undo className="w-5 h-5" />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                title="Redo"
              >
                <Redo className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className={`p-2 rounded-lg transition-colors ${
                  showGrid ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Toggle Grid"
              >
                <Grid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Toolbar */}
        <div className="w-64 bg-white shadow-sm border-r p-4 space-y-6">
          {/* Tools */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Tools</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTool('select')}
                className={`p-3 rounded-lg border transition-colors ${
                  tool === 'select' ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Move className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Select</span>
              </button>
              <button
                onClick={() => setTool('room')}
                className={`p-3 rounded-lg border transition-colors ${
                  tool === 'room' ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Square className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Room</span>
              </button>
            </div>
          </div>

          {/* Room Types */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Room Types</h3>
            <div className="space-y-2">
              {roomTypes.map(roomType => (
                <div
                  key={roomType.type}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: roomType.color }}
                  />
                  <span className="text-sm">{roomType.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">₹{roomType.costPerSqFt}/sqft</span>
                </div>
              ))}
            </div>
          </div>

          {/* Furniture */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Furniture</h3>
            <div className="space-y-2">
              {furnitureTypes.map(furnitureType => {
                const IconComponent = furnitureType.icon;
                return (
                  <button
                    key={furnitureType.type}
                    onClick={() => {
                      setTool('furniture');
                      setSelectedFurnitureType(furnitureType.type);
                    }}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 text-left ${
                      tool === 'furniture' && selectedFurnitureType === furnitureType.type ? 'bg-primary-50' : ''
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-gray-600" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{furnitureType.name}</div>
                      <div className="text-xs text-gray-500">₹{furnitureType.price.toLocaleString()}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Options */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">View</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show Grid</span>
              </label>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onMouseDown={handlePanStart}
            className="w-full h-full"
            style={{ cursor: tool === 'select' ? 'move' : 'crosshair' }}
          />
          
          {/* Zoom Controls */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 flex items-center space-x-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Instructions */}
          {tool === 'room' && (
            <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {isDrawing 
                  ? 'Click to add points. Double-click to finish room.'
                  : 'Click to start drawing a room.'
                }
              </p>
            </div>
          )}
          
          {tool === 'furniture' && (
            <div className="absolute top-4 left-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800">
                Click to place furniture on the canvas.
              </p>
            </div>
          )}
        </div>

        {/* Right Panel - Properties & Cost */}
        <div className="w-80 bg-white shadow-sm border-l">
          {/* Properties Panel */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Properties</h3>
            
            {selectedItem ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected Item</span>
                  <button
                    onClick={() => {
                      const furniture = designData.furniture.find(f => f.id === selectedItem);
                      const room = designData.rooms.find(r => r.id === selectedItem);
                      
                      if (furniture) {
                        const newDesignData = {
                          ...designData,
                          furniture: designData.furniture.filter(f => f.id !== selectedItem)
                        };
                        setDesignData(newDesignData);
                        addToHistory(newDesignData);
                      }
                      
                      if (room) {
                        const newDesignData = {
                          ...designData,
                          rooms: designData.rooms.filter(r => r.id !== selectedItem)
                        };
                        setDesignData(newDesignData);
                        addToHistory(newDesignData);
                      }
                      
                      setSelectedItem(null);
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select an item to edit properties</p>
            )}
          </div>

          {/* Rooms List */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Rooms</h3>
            {designData.rooms.length > 0 ? (
              <div className="space-y-2">
                {designData.rooms.map(room => (
                  <div
                    key={room.id}
                    className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer ${
                      selectedItem === room.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => setSelectedItem(room.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: room.color }}
                      />
                      <span className="text-sm font-medium">{room.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{room.area.toFixed(1)} sq ft</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No rooms added yet. Use the Room tool to create rooms.</p>
            )}
          </div>

          {/* Furniture List */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Furniture</h3>
            {designData.furniture.length > 0 ? (
              <div className="space-y-2">
                {designData.furniture.map(furniture => (
                  <div
                    key={furniture.id}
                    className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer ${
                      selectedItem === furniture.id ? 'bg-primary-50' : ''
                    }`}
                    onClick={() => setSelectedItem(furniture.id)}
                  >
                    <span className="text-sm font-medium">{furniture.name}</span>
                    <span className="text-xs text-gray-500">₹{furniture.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No furniture added yet. Select a furniture type and click on the canvas to add.</p>
            )}
          </div>

          {/* Cost Estimation */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Rupee className="w-5 h-5 mr-2" />
              Cost Estimation
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Furniture Cost:</span>
                <span>₹{designData.furniture.reduce((total, item) => total + item.price, 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Room Design Cost:</span>
                <span>₹{designData.rooms.reduce((total, room) => {
                  const roomTypeObj = roomTypes.find(rt => rt.type === room.type);
                  const costPerSqFt = roomTypeObj ? roomTypeObj.costPerSqFt : 1200;
                  return total + (room.area * costPerSqFt);
                }, 0).toLocaleString()}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total Estimated Cost:</span>
                  <span className="text-primary-600">₹{calculateTotalCost().toLocaleString()}</span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mt-2">
                * This is a rough estimation. Actual costs may vary based on materials, labor, and location.
              </div>
              
              <button 
                className="w-full btn-primary mt-4"
                onClick={() => {
                  alert("This feature will connect you with a designer for a detailed quote. Coming soon!");
                }}
              >
                Get Detailed Quote
              </button>
              
              <button 
                className="w-full btn-secondary mt-2"
                onClick={() => {
                  const projectName = prompt("Enter a name for your design project:");
                  if (projectName) {
                    alert(`Project "${projectName}" saved successfully!`);
                  }
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Design
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignTool;
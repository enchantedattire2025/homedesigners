import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Square, Move, Trash2, Save, Undo, Redo, Grid, Calculator, IndianRupee as Rupee, Plus, Minus, ArrowLeft, Palette, Sofa, Bed, Table, Armchair as Chair, Tv, Lamp, DoorOpen, Refrigerator, BookOpen, Monitor, Wine } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDesignerProfile } from '../hooks/useDesignerProfile';
import { supabase } from '../lib/supabase';
import SaveDesignModal from '../components/SaveDesignModal';

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
  const [tool, setTool] = useState<'select' | 'wall' | 'room' | 'furniture'>('select');
  const [selectedFurnitureType, setSelectedFurnitureType] = useState<string>('sofa');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('living');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [wallThickness, setWallThickness] = useState(6);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [designerId, setDesignerId] = useState<string>('');
  
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
    { type: 'wardrobe', name: 'Wardrobe', icon: DoorOpen, width: 40, height: 80, price: 35000, color: '#A0522D' },
    { type: 'bookshelf', name: 'Bookshelf', icon: BookOpen, width: 35, height: 70, price: 18000, color: '#8B4513' },
    { type: 'desk', name: 'Work Desk', icon: Monitor, width: 50, height: 30, price: 15000, color: '#654321' },
    { type: 'nightstand', name: 'Nightstand', icon: Lamp, width: 20, height: 20, price: 5000, color: '#D2691E' },
    { type: 'coffee-table', name: 'Coffee Table', icon: Table, width: 40, height: 30, price: 8000, color: '#8B7355' },
    { type: 'refrigerator', name: 'Refrigerator', icon: Refrigerator, width: 30, height: 30, price: 25000, color: '#C0C0C0' },
    { type: 'bar-counter', name: 'Bar Counter', icon: Wine, width: 60, height: 25, price: 20000, color: '#8B4513' },
    { type: 'side-table', name: 'Side Table', icon: Table, width: 18, height: 18, price: 4000, color: '#A0826D' },
  ];

  const roomTypes = [
    { type: 'living', name: 'Living Room', color: '#E3F2FD', costPerSqFt: 1500 },
    { type: 'bedroom', name: 'Bedroom', color: '#F3E5F5', costPerSqFt: 1200 },
    { type: 'kitchen', name: 'Kitchen', color: '#E8F5E8', costPerSqFt: 2000 },
    { type: 'bathroom', name: 'Bathroom', color: '#FFF3E0', costPerSqFt: 1800 },
    { type: 'dining', name: 'Dining Room', color: '#FCE4EC', costPerSqFt: 1300 },
    { type: 'study', name: 'Study Room', color: '#E1F5FE', costPerSqFt: 1100 },
    { type: 'balcony', name: 'Balcony', color: '#E8EAF6', costPerSqFt: 800 },
    { type: 'corridor', name: 'Corridor', color: '#FFF9C4', costPerSqFt: 600 },
    { type: 'utility', name: 'Utility Room', color: '#F3E5F5', costPerSqFt: 900 },
    { type: 'office', name: 'Home Office', color: '#E0F2F1', costPerSqFt: 1400 },
    { type: 'gym', name: 'Home Gym', color: '#FBE9E7', costPerSqFt: 1200 },
    { type: 'store', name: 'Store Room', color: '#EFEBE9', costPerSqFt: 700 },
    { type: 'guest', name: 'Guest Room', color: '#F1F8E9', costPerSqFt: 1100 },
    { type: 'pooja', name: 'Pooja Room', color: '#FFF8E1', costPerSqFt: 1500 },
    { type: 'laundry', name: 'Laundry Room', color: '#E3F2FD', costPerSqFt: 1000 },
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

  // Fetch designer ID
  useEffect(() => {
    const fetchDesignerId = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && !error) {
        setDesignerId(data.id);
      }
    };

    fetchDesignerId();
  }, [user]);

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

    const gridSize = designData.gridSize * zoom;
    const offsetX = pan.x % gridSize;
    const offsetY = pan.y % gridSize;
    const majorGridSize = gridSize * 5;
    const majorOffsetX = pan.x % majorGridSize;
    const majorOffsetY = pan.y % majorGridSize;

    // Draw minor grid lines (light gray)
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;

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

    // Draw major grid lines (darker)
    ctx.strokeStyle = '#d0d0d0';
    ctx.lineWidth = 1;

    for (let x = majorOffsetX; x < canvas.width; x += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    for (let y = majorOffsetY; y < canvas.height; y += majorGridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [showGrid, designData.gridSize, zoom, pan]);

  const calculateDistance = (p1: Point, p2: Point): number => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy) / designData.scale; // Convert to feet
  };

  const drawRoom = useCallback((ctx: CanvasRenderingContext2D, room: Room) => {
    if (room.points.length < 3) return;

    ctx.beginPath();
    const firstPoint = room.points[0];
    ctx.moveTo(firstPoint.x * zoom + pan.x, firstPoint.y * zoom + pan.y);

    room.points.slice(1).forEach(point => {
      ctx.lineTo(point.x * zoom + pan.x, point.y * zoom + pan.y);
    });

    ctx.closePath();

    // Add subtle shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = room.color;
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw border
    ctx.strokeStyle = selectedItem === room.id ? '#2196F3' : '#666';
    ctx.lineWidth = selectedItem === room.id ? 3 : 1.5;
    ctx.stroke();

    // Draw measurements on each edge if enabled
    if (showMeasurements && zoom > 0.5) {
      ctx.font = `${Math.max(10, 11 * zoom)}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;

      for (let i = 0; i < room.points.length; i++) {
        const p1 = room.points[i];
        const p2 = room.points[(i + 1) % room.points.length];

        const midX = ((p1.x + p2.x) / 2) * zoom + pan.x;
        const midY = ((p1.y + p2.y) / 2) * zoom + pan.y;

        const distance = calculateDistance(p1, p2);
        const label = `${distance.toFixed(1)}'`;

        // Draw text background
        const textMetrics = ctx.measureText(label);
        const bgPadding = 4;
        ctx.fillStyle = 'rgba(33, 150, 243, 0.9)';
        ctx.fillRect(
          midX - textMetrics.width / 2 - bgPadding,
          midY - 8,
          textMetrics.width + bgPadding * 2,
          16
        );

        // Draw text
        ctx.fillStyle = '#fff';
        ctx.fillText(label, midX, midY);
      }
    }

    // Draw room label with background
    const centerX = room.points.reduce((sum, p) => sum + p.x, 0) / room.points.length;
    const centerY = room.points.reduce((sum, p) => sum + p.y, 0) / room.points.length;

    const displayX = centerX * zoom + pan.x;
    const displayY = centerY * zoom + pan.y;

    ctx.font = `${Math.max(12, 14 * zoom)}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const roomLabel = `${room.name}\n${room.area.toFixed(1)} sq ft`;
    const textMetrics = ctx.measureText(room.name);
    const padding = 8;

    // Draw label background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(
      displayX - textMetrics.width / 2 - padding,
      displayY - 18,
      textMetrics.width + padding * 2,
      36
    );

    // Draw label text
    ctx.fillStyle = '#333';
    ctx.fillText(room.name, displayX, displayY - 6);
    ctx.font = `${Math.max(10, 11 * zoom)}px Inter`;
    ctx.fillStyle = '#666';
    ctx.fillText(`${room.area.toFixed(1)} sq ft`, displayX, displayY + 10);
  }, [zoom, pan, selectedItem, showMeasurements, designData.scale]);

  const drawFurniture = useCallback((ctx: CanvasRenderingContext2D, furniture: Furniture) => {
    ctx.save();

    const x = furniture.x * zoom + pan.x;
    const y = furniture.y * zoom + pan.y;
    const width = furniture.width * zoom;
    const height = furniture.height * zoom;

    ctx.translate(x + width/2, y + height/2);
    ctx.rotate(furniture.rotation * Math.PI / 180);

    ctx.strokeStyle = selectedItem === furniture.id ? '#2196F3' : '#666';
    ctx.lineWidth = selectedItem === furniture.id ? 3 : 1.5;

    // Draw realistic furniture shapes based on type
    switch (furniture.type) {
      case 'sofa':
        // Draw L-shaped sofa
        ctx.fillStyle = furniture.color;
        // Main seat
        ctx.fillRect(-width/2, -height/2, width, height * 0.7);
        // Backrest
        ctx.fillRect(-width/2, -height/2, width, height * 0.15);
        // Armrests
        ctx.fillRect(-width/2, -height/2, width * 0.15, height * 0.7);
        ctx.fillRect(width/2 - width * 0.15, -height/2, width * 0.15, height * 0.7);
        // Cushions
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.strokeRect(-width/2 + width * 0.15 + i * (width * 0.7 / 3), -height/2 + height * 0.15, width * 0.7 / 3, height * 0.55);
        }
        ctx.strokeStyle = selectedItem === furniture.id ? '#2196F3' : '#666';
        ctx.lineWidth = selectedItem === furniture.id ? 3 : 1.5;
        ctx.strokeRect(-width/2, -height/2, width, height * 0.7);
        break;

      case 'bed':
        // Draw bed with headboard
        ctx.fillStyle = furniture.color;
        // Mattress
        ctx.fillRect(-width/2, -height/2 + height * 0.15, width, height * 0.85);
        ctx.strokeRect(-width/2, -height/2 + height * 0.15, width, height * 0.85);
        // Headboard
        ctx.fillStyle = '#8B7355';
        ctx.fillRect(-width/2, -height/2, width, height * 0.2);
        ctx.strokeRect(-width/2, -height/2, width, height * 0.2);
        // Pillows
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-width/2 + width * 0.1, -height/2 + height * 0.2, width * 0.35, height * 0.15);
        ctx.fillRect(width/2 - width * 0.45, -height/2 + height * 0.2, width * 0.35, height * 0.15);
        ctx.strokeRect(-width/2 + width * 0.1, -height/2 + height * 0.2, width * 0.35, height * 0.15);
        ctx.strokeRect(width/2 - width * 0.45, -height/2 + height * 0.2, width * 0.35, height * 0.15);
        break;

      case 'dining-table':
        // Draw table with chairs indication
        ctx.fillStyle = furniture.color;
        // Table top
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
        // Table legs
        ctx.fillStyle = '#654321';
        const legSize = Math.min(width, height) * 0.08;
        ctx.fillRect(-width/2 + legSize, -height/2 + legSize, legSize, legSize);
        ctx.fillRect(width/2 - legSize * 2, -height/2 + legSize, legSize, legSize);
        ctx.fillRect(-width/2 + legSize, height/2 - legSize * 2, legSize, legSize);
        ctx.fillRect(width/2 - legSize * 2, height/2 - legSize * 2, legSize, legSize);
        break;

      case 'chair':
        // Draw chair
        ctx.fillStyle = furniture.color;
        // Seat
        ctx.fillRect(-width/2, -height/2 + height * 0.4, width, height * 0.6);
        ctx.strokeRect(-width/2, -height/2 + height * 0.4, width, height * 0.6);
        // Backrest
        ctx.fillRect(-width/2 + width * 0.1, -height/2, width * 0.8, height * 0.5);
        ctx.strokeRect(-width/2 + width * 0.1, -height/2, width * 0.8, height * 0.5);
        break;

      case 'tv':
        // Draw TV stand with screen
        ctx.fillStyle = '#222';
        // Screen
        ctx.fillRect(-width/2 + width * 0.1, -height/2, width * 0.8, height * 0.6);
        ctx.strokeRect(-width/2 + width * 0.1, -height/2, width * 0.8, height * 0.6);
        // Stand
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2 + height * 0.65, width, height * 0.35);
        ctx.strokeRect(-width/2, -height/2 + height * 0.65, width, height * 0.35);
        break;

      case 'lamp':
        // Draw lamp
        ctx.fillStyle = furniture.color;
        // Lampshade
        ctx.beginPath();
        ctx.moveTo(-width/2, -height/2);
        ctx.lineTo(width/2, -height/2);
        ctx.lineTo(width/2 - width * 0.2, height/2 - height * 0.4);
        ctx.lineTo(-width/2 + width * 0.2, height/2 - height * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Base
        ctx.fillRect(-width/2 + width * 0.3, height/2 - height * 0.4, width * 0.4, height * 0.4);
        break;

      case 'wardrobe':
        // Draw wardrobe with doors
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
        // Door divider
        ctx.strokeStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(0, -height/2);
        ctx.lineTo(0, height/2);
        ctx.stroke();
        // Door handles
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(-width/4 - 2, 0, 4, height * 0.1);
        ctx.fillRect(width/4 - 2, 0, 4, height * 0.1);
        break;

      case 'bookshelf':
        // Draw bookshelf with shelves
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
        // Shelves
        ctx.strokeStyle = '#654321';
        for (let i = 1; i < 5; i++) {
          ctx.beginPath();
          ctx.moveTo(-width/2, -height/2 + (height * i / 5));
          ctx.lineTo(width/2, -height/2 + (height * i / 5));
          ctx.stroke();
        }
        break;

      case 'desk':
        // Draw desk
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height * 0.7);
        ctx.strokeRect(-width/2, -height/2, width, height * 0.7);
        // Legs
        ctx.fillStyle = '#654321';
        const deskLegWidth = width * 0.08;
        ctx.fillRect(-width/2 + deskLegWidth, -height/2 + height * 0.7, deskLegWidth, height * 0.3);
        ctx.fillRect(width/2 - deskLegWidth * 2, -height/2 + height * 0.7, deskLegWidth, height * 0.3);
        break;

      case 'nightstand':
        // Draw nightstand
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
        // Drawer lines
        ctx.strokeStyle = '#654321';
        ctx.beginPath();
        ctx.moveTo(-width/2, -height/6);
        ctx.lineTo(width/2, -height/6);
        ctx.moveTo(-width/2, height/6);
        ctx.lineTo(width/2, height/6);
        ctx.stroke();
        break;

      case 'coffee-table':
        // Draw coffee table
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height * 0.6);
        ctx.strokeRect(-width/2, -height/2, width, height * 0.6);
        // Legs
        ctx.fillStyle = '#654321';
        const ctLegSize = Math.min(width, height) * 0.1;
        ctx.fillRect(-width/2 + ctLegSize, -height/2 + height * 0.6, ctLegSize, height * 0.4);
        ctx.fillRect(width/2 - ctLegSize * 2, -height/2 + height * 0.6, ctLegSize, height * 0.4);
        break;

      case 'refrigerator':
        // Draw refrigerator
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
        // Freezer section
        ctx.strokeStyle = '#999';
        ctx.beginPath();
        ctx.moveTo(-width/2, -height/2 + height * 0.4);
        ctx.lineTo(width/2, -height/2 + height * 0.4);
        ctx.stroke();
        // Handles
        ctx.fillStyle = '#888';
        ctx.fillRect(width/2 - width * 0.15, -height/2 + height * 0.15, width * 0.08, height * 0.15);
        ctx.fillRect(width/2 - width * 0.15, -height/2 + height * 0.55, width * 0.08, height * 0.15);
        break;

      case 'bar-counter':
        // Draw bar counter
        ctx.fillStyle = furniture.color;
        // Counter top
        ctx.fillRect(-width/2, -height/2, width, height * 0.3);
        ctx.strokeRect(-width/2, -height/2, width, height * 0.3);
        // Base
        ctx.fillRect(-width/2 + width * 0.1, -height/2 + height * 0.3, width * 0.8, height * 0.7);
        ctx.strokeRect(-width/2 + width * 0.1, -height/2 + height * 0.3, width * 0.8, height * 0.7);
        break;

      case 'side-table':
        // Draw side table
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height * 0.6);
        ctx.strokeRect(-width/2, -height/2, width, height * 0.6);
        // Single leg
        ctx.fillRect(-width * 0.15, -height/2 + height * 0.6, width * 0.3, height * 0.4);
        break;

      default:
        // Default rectangle for unknown types
        ctx.fillStyle = furniture.color;
        ctx.fillRect(-width/2, -height/2, width, height);
        ctx.strokeRect(-width/2, -height/2, width, height);
    }

    // Draw furniture label
    ctx.fillStyle = '#333';
    ctx.font = `${Math.max(10, 12 * zoom)}px Inter`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(furniture.name, 0, 0);

    ctx.restore();
  }, [zoom, pan, selectedItem]);

  const drawWall = useCallback((ctx: CanvasRenderingContext2D, wall: Wall) => {
    const startX = wall.start.x * zoom + pan.x;
    const startY = wall.start.y * zoom + pan.y;
    const endX = wall.end.x * zoom + pan.x;
    const endY = wall.end.y * zoom + pan.y;
    const thickness = wall.thickness * zoom;

    // Calculate perpendicular offset for wall thickness
    const dx = endX - startX;
    const dy = endY - startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / length) * (thickness / 2);
    const offsetY = (dx / length) * (thickness / 2);

    // Draw wall as a filled rectangle
    ctx.fillStyle = wall.color;
    ctx.strokeStyle = selectedItem === wall.id ? '#2196F3' : '#333';
    ctx.lineWidth = selectedItem === wall.id ? 2 : 0.5;

    ctx.beginPath();
    ctx.moveTo(startX + offsetX, startY + offsetY);
    ctx.lineTo(endX + offsetX, endY + offsetY);
    ctx.lineTo(endX - offsetX, endY - offsetY);
    ctx.lineTo(startX - offsetX, startY - offsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw end caps for rounded wall ends
    ctx.fillStyle = wall.color;
    ctx.beginPath();
    ctx.arc(startX, startY, thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endX, endY, thickness / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw wall measurement if enabled
    if (showMeasurements && zoom > 0.5) {
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;
      const wallLength = calculateDistance(wall.start, wall.end);
      const label = `${wallLength.toFixed(1)}'`;

      ctx.font = `${Math.max(10, 11 * zoom)}px Inter`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw text background
      const textMetrics = ctx.measureText(label);
      const bgPadding = 4;
      ctx.fillStyle = 'rgba(160, 160, 160, 0.95)';
      ctx.fillRect(
        midX - textMetrics.width / 2 - bgPadding,
        midY - 8,
        textMetrics.width + bgPadding * 2,
        16
      );

      // Draw text
      ctx.fillStyle = '#fff';
      ctx.fillText(label, midX, midY);
    }
  }, [zoom, pan, selectedItem, showMeasurements]);

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
      if (tool === 'wall') {
        // Show wall being drawn
        const firstPoint = currentPoints[0];
        ctx.fillStyle = 'rgba(160, 160, 160, 0.5)';
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(firstPoint.x * zoom + pan.x, firstPoint.y * zoom + pan.y, wallThickness * zoom / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
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
    }
  }, [designData, drawGrid, drawRoom, drawWall, drawFurniture, isDrawing, currentPoints, zoom, pan, tool, wallThickness]);

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
    
    if (tool === 'wall') {
      if (!isDrawing) {
        setIsDrawing(true);
        setCurrentPoints([point]);
      } else {
        // Complete wall
        const newWall: Wall = {
          id: Date.now().toString(),
          start: currentPoints[0],
          end: point,
          thickness: wallThickness,
          color: '#A0A0A0'
        };

        const newDesignData = {
          ...designData,
          walls: [...designData.walls, newWall]
        };

        setDesignData(newDesignData);
        addToHistory(newDesignData);

        // Continue drawing from this point
        setCurrentPoints([point]);
      }
    } else if (tool === 'room') {
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
      // Complete room using the selected room type
      const roomType = roomTypes.find(rt => rt.type === selectedRoomType) || roomTypes[0];
      const area = calculatePolygonArea(currentPoints);
      const roomsOfSameType = designData.rooms.filter(r => r.type === roomType.type).length;
      const newRoom: Room = {
        id: Date.now().toString(),
        name: `${roomType.name}${roomsOfSameType > 0 ? ` ${roomsOfSameType + 1}` : ''}`,
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

  const handleSaveDesign = async (quoteId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      throw new Error('Canvas not found');
    }

    // Convert canvas to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        },
        'image/png',
        1.0
      );
    });

    // Create a unique filename
    const timestamp = Date.now();
    const filename = `design_${timestamp}.png`;
    const filePath = `${quoteId}/design/${filename}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('quotation-attachments')
      .upload(filePath, blob, {
        contentType: 'image/png',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload design image');
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('quotation-attachments')
      .getPublicUrl(filePath);

    const designImageUrl = urlData.publicUrl;

    // Update the quotation with the design image URL
    const { error: updateError } = await supabase
      .from('designer_quotes')
      .update({ design_image_url: designImageUrl })
      .eq('id', quoteId);

    if (updateError) {
      console.error('Update error:', updateError);
      throw new Error('Failed to update quotation with design image');
    }

    alert('Design saved successfully and attached to quotation!');
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
                onClick={() => {
                  setTool('select');
                  setIsDrawing(false);
                  setCurrentPoints([]);
                }}
                className={`p-3 rounded-lg border transition-colors ${
                  tool === 'select' ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Move className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Select</span>
              </button>
              <button
                onClick={() => setTool('wall')}
                className={`p-3 rounded-lg border transition-colors ${
                  tool === 'wall' ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
                title="Click to start wall, click again to place end. Click repeatedly to draw connected walls."
              >
                <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="2" y="10" width="20" height="4" strokeWidth="2" />
                </svg>
                <span className="text-xs">Wall</span>
              </button>
              <button
                onClick={() => setTool('room')}
                className={`p-3 rounded-lg border transition-colors ${
                  tool === 'room' ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
                title="Click to add points, double-click to finish room"
              >
                <Square className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Room</span>
              </button>
              <button
                onClick={() => setTool('furniture')}
                className={`p-3 rounded-lg border transition-colors ${
                  tool === 'furniture' ? 'bg-primary-100 border-primary-300 text-primary-700' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Sofa className="w-5 h-5 mx-auto mb-1" />
                <span className="text-xs">Furniture</span>
              </button>
            </div>

            {/* Wall thickness control */}
            {tool === 'wall' && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-xs font-medium text-gray-700 block mb-2">
                  Wall Thickness: {wallThickness}"
                </label>
                <input
                  type="range"
                  min="4"
                  max="12"
                  value={wallThickness}
                  onChange={(e) => setWallThickness(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600 mt-2">
                  Click to start, click again to finish wall. Keep clicking to draw connected walls.
                </p>
              </div>
            )}
          </div>

          {/* Room Types */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Room Types</h3>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {roomTypes.map(roomType => (
                <button
                  key={roomType.type}
                  onClick={() => {
                    setSelectedRoomType(roomType.type);
                    setTool('room');
                  }}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors ${
                    tool === 'room' && selectedRoomType === roomType.type ? 'bg-primary-50 border border-primary-300' : ''
                  }`}
                >
                  <div
                    className="w-4 h-4 rounded flex-shrink-0"
                    style={{ backgroundColor: roomType.color }}
                  />
                  <span className="text-sm flex-1 text-left">{roomType.name}</span>
                  <span className="text-xs text-gray-500">₹{roomType.costPerSqFt}/sqft</span>
                </button>
              ))}
            </div>
          </div>

          {/* Furniture */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Furniture</h3>
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {furnitureTypes.map(furnitureType => {
                const IconComponent = furnitureType.icon;
                return (
                  <button
                    key={furnitureType.type}
                    onClick={() => {
                      setTool('furniture');
                      setSelectedFurnitureType(furnitureType.type);
                    }}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors ${
                      tool === 'furniture' && selectedFurnitureType === furnitureType.type ? 'bg-primary-50 border border-primary-300' : ''
                    }`}
                  >
                    <IconComponent className="w-4 h-4 text-gray-600 flex-shrink-0" />
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
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show Grid</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMeasurements}
                  onChange={(e) => setShowMeasurements(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">Show Measurements</span>
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
            <div className="absolute top-4 left-4 bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-xs">
              <p className="text-sm text-blue-800 font-semibold mb-1">
                Room Type: {roomTypes.find(rt => rt.type === selectedRoomType)?.name}
              </p>
              <p className="text-sm text-blue-800">
                {isDrawing
                  ? 'Click to add points. Double-click to finish room.'
                  : 'Click to start drawing a room. Select a different room type from the sidebar if needed.'
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
                onClick={() => setShowSaveModal(true)}
                disabled={designData.rooms.length === 0 && designData.furniture.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Design to Quotation
              </button>
            </div>
          </div>
        </div>
      </div>

      <SaveDesignModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveDesign}
        designerId={designerId}
      />
    </div>
  );
};

export default DesignTool;
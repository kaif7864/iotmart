import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Line, Circle } from 'react-konva';
import { motion, AnimatePresence } from 'framer-motion';
import { COMPONENT_LIBRARY, COMPONENT_CATEGORIES } from '../../utils/circuitComponents';
import { simulateCircuit, getStateColor, COMPONENT_STATES } from '../../utils/simulationEngine';
import { ArduinoInterpreter } from '../../utils/arduinoInterpreter';
import CodeEditorPanel from './CodeEditorPanel';
import CustomComponentModal from './CustomComponentModal';
import { Play, Square, Trash2, ShoppingCart, X, RefreshCw, Code2, PlusCircle, Save, FolderOpen } from 'lucide-react';
import NexarSearch from './NexarSearch';
import LabSettingsModal from './LabSettingsModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import apiClient from '../../services/api.client';

let instanceCounter = 0;

const IoTLabCanvas = ({ onAddToCart }) => {
  const [components, setComponents] = useState([]);
  const [wires, setWires] = useState([]);
  const [selected, setSelected] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStates, setSimStates] = useState({});
  const [simReadings, setSimReadings] = useState({});
  const [logs, setLogs] = useState([{ type: 'info', msg: '[SYS] IoTMart Lab ready. Add components to begin.' }]);
  const [drawingWire, setDrawingWire] = useState(null);
  const [showBOM, setShowBOM] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customComponents, setCustomComponents] = useState([]);
  const [isCodeRunning, setIsCodeRunning] = useState(false);
  const [pinDrivenStates, setPinDrivenStates] = useState({}); // { '13': 1, '9': 128 }
  const [circuitName, setCircuitName] = useState('Untitled Project');
  const [userDesigns, setUserDesigns] = useState([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const { user } = useAuth();
  const simInterval = useRef(null);
  const interpreterRef = useRef(null);

  const saveCircuit = async () => {
    if (!user) return toast.error("Please login to save your design");
    try {
      await apiClient.post('/circuits/', {
        name: circuitName,
        userId: user._id,
        components,
        wires,
        code: '', // Can be extended to save code too
      });
      toast.success("Circuit saved!");
    } catch (e) {
      toast.error("Failed to save circuit");
    }
  };

  const loadUserDesigns = async () => {
    if (!user) return;
    try {
      const resp = await apiClient.get(`/circuits/${user._id}`);
      setUserDesigns(resp.data);
      setShowLoadModal(true);
    } catch (e) {
      toast.error("Failed to fetch designs");
    }
  };

  const loadCircuit = (design) => {
    setComponents(design.components);
    setWires(design.wires);
    setCircuitName(design.name);
    setShowLoadModal(false);
    toast.success(`Loaded: ${design.name}`);
  };

  const addComponent = useCallback((componentKey) => {
    const template = COMPONENT_LIBRARY[componentKey];
    if (!template) return;
    instanceCounter++;
    const newComp = {
      ...template,
      instanceId: `${componentKey}_${instanceCounter}`,
      label: `${template.shortName}${instanceCounter}`,
      x: 150 + Math.random() * 300,
      y: 100 + Math.random() * 200,
    };
    setComponents(prev => [...prev, newComp]);
    setLogs(prev => [{ type: 'info', msg: `[SYS] Added ${template.name} to canvas.` }, ...prev].slice(0, 30));
  }, []);

  const addCustomComponent = useCallback((template) => {
    setCustomComponents(prev => [...prev, template]);
    instanceCounter++;
    setComponents(prev => [...prev, {
      ...template,
      instanceId: `CUSTOM_${instanceCounter}`,
      label: `${template.shortName}${instanceCounter}`,
      x: 200 + Math.random() * 200,
      y: 120 + Math.random() * 150,
    }]);
    setLogs(prev => [{ type: 'success', msg: `[SYS] Custom component "${template.name}" added.` }, ...prev].slice(0, 40));
  }, []);

  // Build pin→component map from wires
  const buildPinMap = useCallback(() => {
    const map = {}; // { 'D13': instanceId, 'd13': instanceId }
    wires.forEach(w => {
      if (w.fromPin) map[w.fromPin] = { instanceId: w.fromInstance, toInstanceId: w.toInstance, toPin: w.toPin };
      if (w.toPin) map[w.toPin] = { instanceId: w.toInstance, toInstanceId: w.fromInstance, toPin: w.fromPin };
    });
    return map;
  }, [wires]);

  // Called by Arduino interpreter when pin changes
  const handlePinChange = useCallback((pin, value) => {
    setPinDrivenStates(prev => ({ ...prev, [String(pin)]: value }));
    // Map pin number to component via wire connections
    const pinId = `d${pin}`;
    const compWithPin = components.find(c =>
      [...(c.pinsLeft || []), ...(c.pinsRight || []), ...(c.pins || [])].some(p => p.id === pinId)
    );
    if (compWithPin) {
      const newState = value > 0 ? COMPONENT_STATES.OK : COMPONENT_STATES.IDLE;
      setSimStates(prev => ({ ...prev, [compWithPin.instanceId]: newState }));
      // Find what's connected to this board pin via wires
      wires.forEach(w => {
        const targetId = w.fromInstance === compWithPin.instanceId && w.fromPin === pinId
          ? w.toInstance
          : w.toInstance === compWithPin.instanceId && w.toPin === pinId
          ? w.fromInstance : null;
        if (targetId) {
          setSimStates(prev => ({ ...prev, [targetId]: value > 0 ? COMPONENT_STATES.OK : COMPONENT_STATES.IDLE }));
          setSimReadings(prev => ({ ...prev, [targetId]: { brightness: value / 255 } }));
        }
      });
    }
  }, [components, wires]);

  const handleCodeRun = useCallback((code) => {
    setIsCodeRunning(true);
    setSimStates({});
    setSimReadings({});
    const interp = new ArduinoInterpreter(
      handlePinChange,
      (text) => setLogs(prev => [{ type: 'info', msg: `[Serial] ${text}` }, ...prev].slice(0, 50)),
      (msg, type) => setLogs(prev => [{ type, msg }, ...prev].slice(0, 50)),
    );
    interpreterRef.current = interp;
    interp.run(code);
  }, [handlePinChange]);

  const handleCodeStop = useCallback(() => {
    interpreterRef.current?.stop();
    setIsCodeRunning(false);
    setSimStates({});
    setPinDrivenStates({});
  }, []);

  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    setLogs(prev => [{ type: 'success', msg: '[SYS] ▶ Simulation started...' }, ...prev]);
    const run = () => {
      const { states, logs: newLogs, readings } = simulateCircuit(components, wires);
      setSimStates(states);
      setSimReadings(readings);
      setLogs(prev => [...newLogs.map(l => l), ...prev].slice(0, 40));
    };
    run();
    simInterval.current = setInterval(run, 1500);
  }, [components, wires]);

  const stopSimulation = useCallback(() => {
    setIsSimulating(false);
    clearInterval(simInterval.current);
    setSimStates({});
    setLogs(prev => [{ type: 'warn', msg: '[SYS] ⏹ Simulation stopped.' }, ...prev]);
  }, []);

  const clearCanvas = () => {
    stopSimulation();
    setComponents([]);
    setWires([]);
    setSelected(null);
    setLogs([{ type: 'info', msg: '[SYS] Canvas cleared.' }]);
  };

  const deleteSelected = () => {
    if (!selected) return;
    setComponents(prev => prev.filter(c => c.instanceId !== selected));
    setWires(prev => prev.filter(w => w.fromInstance !== selected && w.toInstance !== selected));
    setSelected(null);
  };

  const getStateGlow = (instanceId) => {
    const state = simStates[instanceId];
    if (!state || state === COMPONENT_STATES.DISCONNECTED) return '#334155';
    return getStateColor(state);
  };

  const getBrightness = (instanceId) => {
    const r = simReadings[instanceId];
    return r?.brightness || 0;
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-dark">
      {/* Left Palette */}
      <aside className="w-56 bg-surface-dark border-r border-lab-border flex flex-col overflow-y-auto shrink-0">
        <div className="p-3 border-b border-lab-border flex items-center justify-between">
          <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Components</p>
          <button onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-1 px-2 py-1 bg-violet-700 hover:bg-violet-600 text-white rounded-sm text-[7px] font-black uppercase tracking-widest transition-all">
            <PlusCircle className="h-2.5 w-2.5" /> Custom
          </button>
        </div>

        {/* Custom Components Section */}
        {customComponents.length > 0 && (
          <div className="border-b border-lab-border-dark">
            <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest px-4 py-2">🔌 My Components</p>
            {customComponents.map(comp => (
              <button key={comp.id} onClick={() => {
                instanceCounter++;
                setComponents(prev => [...prev, { ...comp, instanceId: `${comp.id}_${instanceCounter}`, label: `${comp.shortName}${instanceCounter}`, x: 200 + Math.random() * 200, y: 120 }]);
              }} className="w-full text-left px-4 py-2 hover:bg-surface-dark transition-all flex items-center gap-3 group">
                <span className="text-base">{comp.icon}</span>
                <div>
                  <p className="text-[10px] font-bold text-violet-300 group-hover:text-white">{comp.name}</p>
                  <p className="text-[8px] text-text-secondary">{comp.pins?.length} pins</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {COMPONENT_CATEGORIES.map(cat => (
          <div key={cat.label} className="border-b border-lab-border-dark">
            <p className="text-[8px] font-black text-text-secondary uppercase tracking-widest px-4 py-2">{cat.icon} {cat.label}</p>
            {cat.components.map(key => {
              const comp = COMPONENT_LIBRARY[key];
              return (
                <button key={key} onClick={() => addComponent(key)}
                  className="w-full text-left px-4 py-2 hover:bg-surface-dark transition-all flex items-center gap-3 group">
                  <span className="text-base">{comp.icon}</span>
                  <div>
                    <p className="text-[10px] font-bold text-lab-text group-hover:text-white">{comp.name}</p>
                    <p className="text-[8px] text-text-secondary">{comp.type}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
        {/* Nexar Real-World Search */}
        <NexarSearch onAddToCanvas={addCustomComponent} onAddToCart={onAddToCart} />
      </aside>

      {/* Main Canvas Area */}

      <div className="flex-grow flex flex-col">
        {/* Toolbar */}
        <div className="h-12 bg-surface-dark border-b border-lab-border flex items-center px-4 gap-3 shrink-0">
          {!isSimulating ? (
            <button onClick={startSimulation} className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-sm text-[10px] font-black uppercase tracking-widest transition-all">
              <Play className="h-3 w-3" /> Simulate
            </button>
          ) : (
            <button onClick={stopSimulation} className="flex items-center gap-2 px-4 py-1.5 bg-red-600 hover:bg-status-danger text-white rounded-sm text-[10px] font-black uppercase tracking-widest transition-all animate-pulse">
              <Square className="h-3 w-3" /> Stop
            </button>
          )}
          <button onClick={deleteSelected} disabled={!selected} className="flex items-center gap-2 px-3 py-1.5 bg-lab-surface hover:bg-lab-surface-hover text-lab-text rounded-sm text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30">
            <Trash2 className="h-3 w-3" /> Delete
          </button>
          
          <div className="h-4 w-[1px] bg-lab-surface mx-1" />
          
          <input 
            value={circuitName} 
            onChange={e => setCircuitName(e.target.value)}
            className="bg-transparent text-white text-[10px] font-black uppercase tracking-widest border-none outline-none w-32 focus:ring-1 focus:ring-accent rounded px-2"
          />
          
          <button onClick={saveCircuit} className="p-2 bg-lab-surface hover:bg-lab-surface-hover text-lab-text rounded-sm transition-all" title="Save Design">
            <Save className="h-3.5 w-3.5" />
          </button>
          
          <button onClick={loadUserDesigns} className="p-2 bg-lab-surface hover:bg-lab-surface-hover text-lab-text rounded-sm transition-all" title="Load Designs">
            <FolderOpen className="h-3.5 w-3.5" />
          </button>

          <button onClick={() => setShowSettings(true)} className="p-2 bg-surface-dark hover:bg-lab-surface text-text-muted rounded-sm transition-all border border-lab-border" title="Lab Settings">
            <Settings className="h-3.5 w-3.5" />
          </button>

          <button onClick={clearCanvas} className="flex items-center gap-2 px-3 py-1.5 bg-lab-surface hover:bg-lab-surface-hover text-lab-text rounded-sm text-[10px] font-black uppercase tracking-widest transition-all">
            <RefreshCw className="h-3 w-3" /> Clear
          </button>
          <div className="flex-grow" />
          <button
            onClick={() => setShowCodeEditor(v => !v)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${
              showCodeEditor ? 'bg-violet-600 text-white' : 'bg-lab-surface hover:bg-lab-surface-hover text-lab-text'
            }`}>
            <Code2 className="h-3 w-3" /> {showCodeEditor ? 'Hide Code' : 'Code Editor'}
          </button>
          <button onClick={() => setShowBOM(true)} className="flex items-center gap-2 px-4 py-1.5 bg-lab-surface hover:bg-lab-surface-hover text-lab-text rounded-sm text-[10px] font-black uppercase tracking-widest transition-all">
            <ShoppingCart className="h-3 w-3" /> BOM
          </button>
        </div>

        <div className="flex flex-grow overflow-hidden" style={{ flexDirection: showCodeEditor ? 'column' : 'row' }}>
          {/* Code editor — top panel when visible */}
          {showCodeEditor && (
            <div className="h-64 shrink-0 border-b border-lab-border">
              <CodeEditorPanel onRun={handleCodeRun} onStop={handleCodeStop} isRunning={isCodeRunning} />
            </div>
          )}
          <div className="flex flex-grow overflow-hidden">
          {/* Konva Stage */}
          <Stage
            width={window.innerWidth - 400}
            height={window.innerHeight - 120}
            draggable
            className="bg-surface-dark"
          >
            <Layer>
              {/* Grid */}
              {Array.from({ length: 60 }).map((_, i) => (
                <Line key={`gx${i}`} points={[i * 30, 0, i * 30, 2000]} stroke="#1e293b" strokeWidth={0.5} />
              ))}
              {Array.from({ length: 40 }).map((_, i) => (
                <Line key={`gy${i}`} points={[0, i * 30, 2000, i * 30]} stroke="#1e293b" strokeWidth={0.5} />
              ))}

              {/* Wires */}
              {wires.map((wire, i) => (
                <Line key={i} points={wire.points} stroke="#38bdf8" strokeWidth={2} lineCap="round" />
              ))}

              {/* Components */}
              {components.map(comp => {
                const glowColor = getStateGlow(comp.instanceId);
                const isSelected = selected === comp.instanceId;
                const brightness = getBrightness(comp.instanceId);
                const isLed = comp.type === 'led';
                const hasSidePins = (comp.pinsLeft && comp.pinsLeft.length > 0) || (comp.pinsRight && comp.pinsRight.length > 0);
                const isBoard = comp.type === 'microcontroller' || hasSidePins;
                const ledOpacity = isSimulating && isLed ? (brightness > 0 ? 0.3 + brightness * 0.7 : 0.15) : 1;
                const W = comp.width || 70;
                const H = comp.height || 50;
                const PIN_SPACING = 18;
                const PIN_START_Y = 30;

                const PIN_COLORS = {
                  power:   '#f59e0b',
                  gnd:     '#6b7280',
                  digital: '#38bdf8',
                  analog:  '#a78bfa',
                  pwm:     '#34d399',
                  serial:  '#fb923c',
                  spi:     '#f472b6',
                  i2c:     '#facc15',
                  special: '#94a3b8',
                };

                const handlePinClick = (e, pin, side, idx) => {
                  e.cancelBubble = true;
                  const pinX = comp.x + (side === 'right' ? W + 8 : -8);
                  const pinY = comp.y + PIN_START_Y + idx * PIN_SPACING;
                  if (!drawingWire) {
                    setDrawingWire({ fromInstance: comp.instanceId, fromPin: pin.id, startX: pinX, startY: pinY });
                  } else {
                    setWires(prev => [...prev, {
                      ...drawingWire, toInstance: comp.instanceId, toPin: pin.id,
                      points: [drawingWire.startX, drawingWire.startY, pinX, pinY],
                    }]);
                    setDrawingWire(null);
                  }
                };

                return (
                  <Group
                    key={comp.instanceId}
                    x={comp.x} y={comp.y}
                    draggable
                    onClick={() => setSelected(comp.instanceId)}
                    onDragEnd={(e) => {
                      const { x, y } = e.target.position();
                      setComponents(prev => prev.map(c =>
                        c.instanceId === comp.instanceId ? { ...c, x, y } : c
                      ));
                    }}
                  >
                    {/* Selection ring */}
                    {isSelected && (
                      <Rect x={-6} y={-6} width={W + 12} height={H + 12}
                        stroke="#7c3aed" strokeWidth={2} cornerRadius={10} dash={[4, 4]} fill="transparent" />
                    )}

                    {/* Body */}
                    <Rect
                      width={W} height={H}
                      fill={isBoard ? (comp.id === 'ARDUINO_UNO' ? '#0f3460' : '#1a1a2e') : (isLed && isSimulating && brightness > 0 ? comp.color : '#1e293b')}
                      stroke={isSelected ? '#7c3aed' : (isBoard ? '#38bdf8' : glowColor)}
                      strokeWidth={isSelected ? 2 : (isBoard ? 1 : 1.5)}
                      cornerRadius={isBoard ? 4 : 6}
                      opacity={ledOpacity}
                      shadowColor={glowColor}
                      shadowBlur={isSimulating ? 8 : 0}
                      shadowOpacity={0.5}
                    />

                    {/* Board chip rect for MCU */}
                    {isBoard && (
                      <Rect x={20} y={H/2 - 20} width={W - 40} height={40}
                        fill="#0d1b2a" stroke="#334155" strokeWidth={1} cornerRadius={3} />
                    )}

                    {/* Label */}
                    <Text text={comp.label} x={0} y={isBoard ? 8 : 5} width={W}
                      align="center" fontSize={isBoard ? 8 : 8} fill="#94a3b8" fontStyle="bold" />

                    {/* Name */}
                    <Text text={isBoard ? comp.name : comp.icon}
                      x={0} y={isBoard ? H/2 - 6 : 16} width={W}
                      align="center" fontSize={isBoard ? 9 : 18}
                      fill={isBoard ? '#7dd3fc' : '#ffffff'} fontStyle={isBoard ? 'bold' : 'normal'} />

                    {/* Status dot */}
                    {isSimulating && (
                      <Circle x={W - 8} y={8} radius={4}
                        fill={glowColor} shadowColor={glowColor} shadowBlur={6} />
                    )}

                    {/* SIDE PINS — Left side (Boards or AI Parts) */}
                    {hasSidePins && comp.pinsLeft?.map((pin, idx) => {
                      const py = PIN_START_Y + idx * PIN_SPACING;
                      const pc = PIN_COLORS[pin.type] || '#38bdf8';
                      return (
                        <Group key={pin.id}>
                          {/* Pin stub line */}
                          <Line points={[-12, py, 0, py]} stroke={pc} strokeWidth={1.5} />
                          {/* Pin dot */}
                          <Circle x={-12} y={py} radius={4} fill={pc}
                            shadowColor={pc} shadowBlur={drawingWire ? 6 : 0}
                            onClick={(e) => handlePinClick(e, pin, 'left', idx)} />
                          {/* Pin label */}
                          <Text text={pin.label} x={-80} y={py - 5} width={64}
                            align="right" fontSize={7} fill={pc} fontStyle="bold" />
                        </Group>
                      );
                    })}

                    {/* SIDE PINS — Right side (Boards or AI Parts) */}
                    {hasSidePins && comp.pinsRight?.map((pin, idx) => {
                      const py = PIN_START_Y + idx * PIN_SPACING;
                      const pc = PIN_COLORS[pin.type] || '#38bdf8';
                      return (
                        <Group key={pin.id}>
                          <Line points={[W, py, W + 12, py]} stroke={pc} strokeWidth={1.5} />
                          <Circle x={W + 12} y={py} radius={4} fill={pc}
                            shadowColor={pc} shadowBlur={drawingWire ? 6 : 0}
                            onClick={(e) => handlePinClick(e, pin, 'right', idx)} />
                          <Text text={pin.label} x={W + 16} y={py - 5} width={64}
                            align="left" fontSize={7} fill={pc} fontStyle="bold" />
                        </Group>
                      );
                    })}

                    {/* GENERIC PINS — If no side pins (Legacy or Simple components) */}
                    {!hasSidePins && comp.pins?.map((pin, idx) => {
                      const px = pin.side === 'right' ? W : 0;
                      const py = 20 + idx * 16;
                      return (
                        <Circle key={pin.id} x={px} y={py} radius={4}
                          fill="#38bdf8" stroke="#0ea5e9" strokeWidth={1}
                          onClick={(e) => {
                            e.cancelBubble = true;
                            const pinX = comp.x + px;
                            const pinY = comp.y + py;
                            if (!drawingWire) {
                              setDrawingWire({ fromInstance: comp.instanceId, fromPin: pin.id, startX: pinX, startY: pinY });
                            } else {
                              setWires(prev => [...prev, {
                                ...drawingWire, toInstance: comp.instanceId, toPin: pin.id,
                                points: [drawingWire.startX, drawingWire.startY, pinX, pinY],
                              }]);
                              setDrawingWire(null);
                            }
                          }}
                        />
                      );
                    })}
                  </Group>
                );
              })}

            </Layer>
          </Stage>

          {/* Properties Panel */}
          <aside className="w-52 bg-surface-dark border-l border-lab-border flex flex-col overflow-y-auto shrink-0 p-4">
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mb-4">Properties</p>
            {selected ? (() => {
              const comp = components.find(c => c.instanceId === selected);
              if (!comp) return null;
              const reading = simReadings[selected] || {};
              const state = simStates[selected] || COMPONENT_STATES.DISCONNECTED;
              return (
                <div className="space-y-3">
                  <div className="bg-surface-dark rounded-sm p-3">
                    <p className="text-[8px] text-text-muted uppercase tracking-widest mb-1">Component</p>
                    <p className="text-sm font-black text-white">{comp.name}</p>
                    <p className="text-[9px] text-text-muted">{comp.instanceId}</p>
                  </div>
                  {isSimulating && (
                    <div className="bg-surface-dark rounded-sm p-3 space-y-2">
                      <p className="text-[8px] text-text-muted uppercase tracking-widest">Live Readings</p>
                      <div className="flex justify-between"><span className="text-[9px] text-text-muted">Voltage</span><span className="text-[9px] font-black text-cyan-400">{(reading.voltage || 0).toFixed(2)}V</span></div>
                      <div className="flex justify-between"><span className="text-[9px] text-text-muted">Current</span><span className="text-[9px] font-black text-cyan-400">{((reading.current || 0) * 1000).toFixed(1)}mA</span></div>
                      <div className="flex justify-between"><span className="text-[9px] text-text-muted">Power</span><span className="text-[9px] font-black text-cyan-400">{((reading.power || 0) * 1000).toFixed(1)}mW</span></div>
                      <div className="flex justify-between"><span className="text-[9px] text-text-muted">Status</span>
                        <span className="text-[9px] font-black" style={{ color: getStateColor(state) }}>
                          {state.toUpperCase()}
                        </span>
                      </div>
                      {comp.type === 'led' && reading.brightness > 0 && (
                        <div>
                          <p className="text-[8px] text-text-muted mb-1">Brightness</p>
                          <div className="h-2 bg-lab-surface rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(reading.brightness || 0) * 100}%`, backgroundColor: comp.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {comp.type === 'resistor' && (
                    <div className="bg-surface-dark rounded-sm p-3">
                      <p className="text-[8px] text-text-muted uppercase tracking-widest mb-2">Resistance (Ω)</p>
                      <input
                        type="number"
                        value={comp.resistance}
                        onChange={e => setComponents(prev => prev.map(c =>
                          c.instanceId === selected ? { ...c, resistance: Number(e.target.value) } : c
                        ))}
                        className="w-full bg-lab-surface text-white text-sm font-black rounded-sm px-3 py-2 outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  )}
                  <div className="bg-surface-dark rounded-sm p-3">
                    <p className="text-[8px] text-text-muted uppercase tracking-widest mb-2">Label</p>
                    <input
                      type="text"
                      value={comp.label}
                      onChange={e => setComponents(prev => prev.map(c =>
                        c.instanceId === selected ? { ...c, label: e.target.value } : c
                      ))}
                      className="w-full bg-lab-surface text-white text-sm font-black rounded-sm px-3 py-2 outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                  <button onClick={deleteSelected} className="w-full flex items-center justify-center gap-2 py-2 bg-red-900/50 hover:bg-red-800 text-red-300 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              );
            })() : (
              <p className="text-[10px] text-text-secondary italic">Click a component to inspect it.</p>
            )}

            {/* Wire instruction */}
            <div className="mt-auto pt-4">
              {drawingWire ? (
                <div className="bg-cyan-900/40 border border-cyan-600 rounded-sm p-3">
                  <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Wiring Mode 🔗</p>
                  <p className="text-[8px] text-text-muted mt-1">Click another pin to connect. Press Esc to cancel.</p>
                  <button onClick={() => setDrawingWire(null)} className="mt-2 text-[8px] text-red-400 hover:text-red-300">✕ Cancel</button>
                </div>
              ) : (
                <div className="bg-surface-dark rounded-sm p-3">
                  <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Wiring</p>
                  <p className="text-[8px] text-text-secondary mt-1">Click a blue pin to start a wire, then click another pin to connect.</p>
                </div>
              )}
            </div>
          </aside>
          </div>
        </div>

        {/* Console */}
        <div className="h-32 bg-surface-dark border-t border-lab-border flex flex-col shrink-0">
          <div className="flex items-center gap-2 px-4 py-1.5 border-b border-lab-border-dark">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <p className="text-[8px] font-black text-text-muted uppercase tracking-widest">Simulation Console</p>
          </div>
          <div className="flex-grow overflow-y-auto p-3 space-y-0.5 font-mono">
            {logs.map((log, i) => (
              <p key={i} className={`text-[10px] leading-relaxed ${
                log.type === 'error' ? 'text-red-400' :
                log.type === 'warn' ? 'text-status-star' :
                log.type === 'success' ? 'text-green-400' : 'text-text-muted'
              }`}>
                <span className="text-text-secondary mr-2">›</span>{log.msg}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* BOM Modal */}
      <AnimatePresence>
        {showBOM && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-surface-dark border border-lab-border w-full max-w-md rounded-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-white text-lg uppercase tracking-tighter">Bill of Materials</h3>
                <button onClick={() => setShowBOM(false)}><X className="h-5 w-5 text-text-muted hover:text-white" /></button>
              </div>
              {components.length === 0 ? (
                <p className="text-text-muted text-sm">No components in circuit.</p>
              ) : (
                <div className="space-y-3">
                  {components.map(comp => (
                    <div key={comp.instanceId} className="flex items-center justify-between bg-surface-dark rounded-sm p-3 border border-lab-border">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{comp.icon}</span>
                        <div>
                          <p className="text-[10px] font-black text-white">{comp.name}</p>
                          {comp.nexarData && (
                            <p className="text-[7px] text-green-400 font-bold uppercase tracking-widest">
                              Real Part · ${comp.nexarData.price || 'N/A'} · {comp.nexarData.seller || 'Market'}
                            </p>
                          )}
                          <p className="text-[8px] text-text-muted">{comp.label}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { onAddToCart && onAddToCart({ _id: comp.id || comp.instanceId, name: comp.name, price: comp.nexarData?.price || 5, image: comp.nexarData?.image || '' }); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 rounded-sm text-[8px] font-black uppercase tracking-widest transition-all"
                      >
                        <ShoppingCart className="h-3 w-3" /> + Cart
                      </button>
                    </div>
                  ))}
                  <button className="w-full mt-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-black text-[10px] uppercase tracking-widest rounded-sm transition-all flex items-center justify-center gap-2">
                    <ShoppingCart className="h-4 w-4" /> Add All to Cart
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Component Creator Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <CustomComponentModal onAdd={addCustomComponent} onClose={() => setShowCustomModal(false)} />
        )}
      </AnimatePresence>
      {/* Load Designs Modal */}
      <AnimatePresence>
        {showLoadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-surface-dark border border-lab-border w-full max-w-md rounded-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-white text-lg uppercase tracking-tighter">My Saved Circuits</h3>
                <button onClick={() => setShowLoadModal(false)}><X className="h-5 w-5 text-text-muted hover:text-white" /></button>
              </div>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {userDesigns.length === 0 ? (
                  <p className="text-text-secondary text-center py-8">No saved designs yet.</p>
                ) : userDesigns.map((design, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadCircuit(design)}
                    className="w-full flex items-center justify-between bg-surface-dark hover:bg-lab-surface rounded-sm p-4 transition-all border border-lab-border group text-left"
                  >
                    <div>
                      <p className="text-xs font-black text-white group-hover:text-violet-400 transition-colors">{design.name}</p>
                      <p className="text-[8px] text-text-secondary mt-1 uppercase tracking-widest">{design.components?.length} Components · {design.wires?.length} Wires</p>
                    </div>
                    <FolderOpen className="h-4 w-4 text-text-secondary group-hover:text-violet-400" />
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LabSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default IoTLabCanvas;

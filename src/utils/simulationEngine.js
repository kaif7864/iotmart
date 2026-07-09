// IoTMart Lab - Physics Simulation Engine
// Implements simplified Ohm's Law + KVL for circuit simulation

export const COMPONENT_STATES = {
  IDLE: 'idle',
  OK: 'ok',
  WARNING: 'warning',
  BURNED: 'burned',
  DISCONNECTED: 'disconnected',
};

/**
 * Find power supply in circuit
 */
const findPowerSupply = (components) =>
  components.find(c => c.type === 'power');

/**
 * Resolve a simple series circuit: Power → R? → LED → GND
 * For MVP: linear chain analysis
 */
export const simulateCircuit = (components, wires) => {
  const logs = [];
  const states = {};
  const readings = {};

  // Initialize all components as disconnected
  components.forEach(c => {
    states[c.instanceId] = COMPONENT_STATES.DISCONNECTED;
    readings[c.instanceId] = {};
  });

  const powerSupply = findPowerSupply(components);
  if (!powerSupply) {
    logs.push({ type: 'warn', msg: '[SYS] No power supply detected. Add a power source to start simulation.' });
    return { states, logs, readings };
  }

  logs.push({ type: 'info', msg: `[SYS] Power supply detected: ${powerSupply.name} @ ${powerSupply.voltage}V` });
  states[powerSupply.instanceId] = COMPONENT_STATES.OK;
  readings[powerSupply.instanceId] = { voltage: powerSupply.voltage };

  // Build adjacency graph from wires
  const graph = buildGraph(components, wires);

  // Find all paths from power+ to GND through components
  const paths = findCircuitPaths(graph, powerSupply, components);

  if (paths.length === 0) {
    logs.push({ type: 'warn', msg: '[SYS] Circuit incomplete — no closed loop detected. Connect components to form a complete circuit.' });
    return { states, logs, readings };
  }

  logs.push({ type: 'success', msg: `[SYS] ${paths.length} circuit path(s) detected. Running simulation...` });

  // Simulate each path
  paths.forEach((path, idx) => {
    const result = analyzePath(path, powerSupply, components, logs);
    
    // Apply results
    result.forEach(({ instanceId, state, voltage, current, power, brightness }) => {
      states[instanceId] = state;
      readings[instanceId] = { ...readings[instanceId], voltage, current, power, brightness };
    });
  });

  // Execute Dynamic Workflows (AI-generated logic)
  components.forEach(comp => {
    if (comp.workflow) {
      try {
        // Execute workflow string as a function
        // Usage: (state, pins) => { ... }
        const workflowFn = new Function('state', 'pins', comp.workflow);
        workflowFn(readings[comp.instanceId], {}); // Pins can be expanded later
        if (readings[comp.instanceId].active) {
            states[comp.instanceId] = COMPONENT_STATES.OK;
        }
      } catch (e) {
        console.error(`Workflow error in ${comp.name}:`, e);
      }
    }
  });

  return { states, logs, readings };
};

const buildGraph = (components, wires) => {
  const graph = {};
  components.forEach(c => {
    graph[c.instanceId] = [];
  });

  wires.forEach(wire => {
    const { fromInstance, toInstance } = wire;
    if (fromInstance && toInstance) {
      graph[fromInstance]?.push(toInstance);
      graph[toInstance]?.push(fromInstance);
    }
  });

  return graph;
};

const findCircuitPaths = (graph, powerSupply, components) => {
  // Simple BFS: find chains of components connected to power supply
  const paths = [];
  const visited = new Set();
  const queue = [[powerSupply.instanceId]];

  while (queue.length > 0) {
    const path = queue.shift();
    const lastId = path[path.length - 1];

    if (visited.has(lastId) && path.length > 1) continue;
    visited.add(lastId);

    const neighbors = graph[lastId] || [];
    if (neighbors.length === 0 && path.length > 1) {
      paths.push(path);
    }

    neighbors.forEach(neighbor => {
      if (!path.includes(neighbor)) {
        queue.push([...path, neighbor]);
      } else if (path.length > 2) {
        // Closed loop detected
        paths.push([...path, neighbor]);
      }
    });
  }

  return paths.length > 0 ? paths : [Object.keys(graph)];
};

const analyzePath = (path, powerSupply, components, logs) => {
  const results = [];
  const supplyVoltage = powerSupply.voltage;

  // Find all resistors and LEDs in the path
  const pathComponents = path.map(id =>
    components.find(c => c.instanceId === id)
  ).filter(Boolean);

  // Calculate total resistance
  let totalResistance = 0;
  let totalForwardVoltage = 0;

  pathComponents.forEach(comp => {
    if (comp.type === 'resistor') {
      totalResistance += comp.resistance || 220;
    }
    if (comp.type === 'led') {
      totalForwardVoltage += comp.forwardVoltage || 2.0;
    }
  });

  // If no resistance, set minimum to avoid division by zero
  if (totalResistance === 0) {
    totalResistance = 0.1; // Short circuit approximation
  }

  const availableVoltage = supplyVoltage - totalForwardVoltage;
  const current = availableVoltage > 0 ? availableVoltage / totalResistance : 0;

  pathComponents.forEach(comp => {
    if (!comp || comp.type === 'power') return;

    let state = COMPONENT_STATES.OK;
    let voltage = 0;
    let power = 0;
    let brightness = 0;

    if (comp.type === 'led') {
      voltage = comp.forwardVoltage;
      power = voltage * current;
      brightness = Math.min(1, current / (comp.maxCurrent || 0.02));

      if (current <= 0) {
        state = COMPONENT_STATES.DISCONNECTED;
        logs.push({ type: 'warn', msg: `[LED] ${comp.label || comp.name}: No current flowing. Check connections.` });
      } else if (current >= (comp.burnCurrent || 0.05)) {
        state = COMPONENT_STATES.BURNED;
        logs.push({ type: 'error', msg: `[LED] ${comp.label || comp.name}: ${(current * 1000).toFixed(1)}mA — BURNED! 🔥 Max is ${(comp.maxCurrent * 1000).toFixed(0)}mA` });
      } else if (current >= (comp.warnCurrent || 0.018)) {
        state = COMPONENT_STATES.WARNING;
        logs.push({ type: 'warn', msg: `[LED] ${comp.label || comp.name}: ${(current * 1000).toFixed(1)}mA — Near limit ⚠️` });
      } else {
        logs.push({ type: 'success', msg: `[LED] ${comp.label || comp.name}: ${(current * 1000).toFixed(1)}mA @ ${voltage}V ✅` });
      }
    }

    if (comp.type === 'resistor') {
      voltage = current * (comp.resistance || 220);
      power = current * current * (comp.resistance || 220);
      const maxPower = comp.maxPower || 0.25;

      if (power > maxPower) {
        state = COMPONENT_STATES.BURNED;
        logs.push({ type: 'error', msg: `[R] ${comp.label || comp.name}: ${power.toFixed(3)}W — OVERLOADED! 🔥 Max ${maxPower}W` });
      } else {
        logs.push({ type: 'success', msg: `[R] ${comp.label || comp.name}: ${(comp.resistance || 220)}Ω, ${(current * 1000).toFixed(1)}mA, ${voltage.toFixed(2)}V ✅` });
      }
    }

    if (comp.type === 'sensor') {
      state = COMPONENT_STATES.OK;
      voltage = comp.operatingVoltage || 5;
      logs.push({ type: 'info', msg: `[SENSOR] ${comp.label || comp.name}: Temp=${comp.simulatedOutput?.temperature || 25}°C, Hum=${comp.simulatedOutput?.humidity || 60}% ✅` });
    }

    if (comp.type === 'microcontroller') {
      state = COMPONENT_STATES.OK;
      voltage = comp.operatingVoltage || 5;
      logs.push({ type: 'info', msg: `[MCU] ${comp.label || comp.name}: Running @ ${voltage}V ✅` });
    }

    if (comp.type === 'output') { // Buzzer
      state = current > 0 ? COMPONENT_STATES.OK : COMPONENT_STATES.DISCONNECTED;
      voltage = comp.operatingVoltage || 5;
      if (current > 0) {
        logs.push({ type: 'info', msg: `[BUZZER] ${comp.label || comp.name}: ACTIVE 🔊` });
      }
    }

    if (comp.type === 'input') { // Button
      state = comp.pressed ? COMPONENT_STATES.OK : COMPONENT_STATES.IDLE;
      logs.push({ type: 'info', msg: `[BTN] ${comp.label || comp.name}: ${comp.pressed ? 'PRESSED' : 'OPEN'}` });
    }

    results.push({ instanceId: comp.instanceId, state, voltage, current, power, brightness });
  });

  return results;
};

export const getStateColor = (state) => {
  switch (state) {
    case COMPONENT_STATES.OK: return '#22c55e';
    case COMPONENT_STATES.WARNING: return '#f59e0b';
    case COMPONENT_STATES.BURNED: return '#ef4444';
    case COMPONENT_STATES.IDLE: return '#94a3b8';
    case COMPONENT_STATES.DISCONNECTED:
    default: return '#64748b';
  }
};

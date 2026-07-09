/**
 * IoTMart Lab - Arduino Code Interpreter
 * Parses Arduino C++ and drives component pin states
 */

export class ArduinoInterpreter {
  constructor(onPinChange, onSerial, onLog) {
    this.onPinChange = onPinChange; // (pin, value) => void
    this.onSerial = onSerial;       // (text) => void
    this.onLog = onLog;             // (msg, type) => void
    this.pinStates = {};            // { 13: HIGH, 9: 128, ... }
    this.running = false;
    this.loopTimer = null;
    this.variables = {};            // user-defined vars
    this.loopDelay = 0;
  }

  // Parse and extract setup() and loop() bodies
  parseCode(code) {
    const extract = (name) => {
      const regex = new RegExp(`void\\s+${name}\\s*\\(\\)\\s*\\{`, 'i');
      const start = code.search(regex);
      if (start === -1) return '';
      let depth = 0, i = code.indexOf('{', start);
      const begin = i + 1;
      for (; i < code.length; i++) {
        if (code[i] === '{') depth++;
        if (code[i] === '}') { depth--; if (depth === 0) return code.slice(begin, i); }
      }
      return '';
    };
    return { setup: extract('setup'), loop: extract('loop') };
  }

  // Execute a block of code line by line, returns total delay in ms
  executeBlock(block) {
    const lines = block.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
    let totalDelay = 0;

    for (const line of lines) {
      // digitalWrite(pin, HIGH/LOW)
      const dw = line.match(/digitalWrite\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
      if (dw) {
        const pin = this.resolveValue(dw[1]);
        const val = dw[2] === 'HIGH' ? 1 : dw[2] === 'LOW' ? 0 : this.resolveValue(dw[2]);
        this.pinStates[pin] = val;
        this.onPinChange(pin, val);
        this.onLog(`digitalWrite(${pin}, ${dw[2]})`, 'info');
        continue;
      }

      // analogWrite(pin, value) — 0-255
      const aw = line.match(/analogWrite\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
      if (aw) {
        const pin = this.resolveValue(aw[1]);
        const val = Math.min(255, Math.max(0, this.resolveValue(aw[2])));
        this.pinStates[pin] = val;
        this.onPinChange(pin, val);
        this.onLog(`analogWrite(${pin}, ${val}) → ${((val/255)*100).toFixed(0)}% duty`, 'info');
        continue;
      }

      // delay(ms)
      const dl = line.match(/delay\s*\(\s*(\w+)\s*\)/);
      if (dl) {
        totalDelay += this.resolveValue(dl[1]);
        continue;
      }

      // Serial.println / Serial.print
      const sp = line.match(/Serial\.print(?:ln)?\s*\(\s*"?([^")]*)"?\s*\)/);
      if (sp) {
        this.onSerial(sp[1]);
        continue;
      }

      // Variable declaration: int x = 5; const int LED = 13;
      const varDecl = line.match(/(?:int|float|bool|const\s+int)\s+(\w+)\s*=\s*([^;]+)/);
      if (varDecl) {
        this.variables[varDecl[1]] = this.resolveValue(varDecl[2].trim());
        continue;
      }

      // Assignment: x = 10;
      const assign = line.match(/^(\w+)\s*=\s*([^;]+)/);
      if (assign && this.variables.hasOwnProperty(assign[1])) {
        this.variables[assign[1]] = this.resolveValue(assign[2].trim());
        continue;
      }

      // pinMode — just log it
      const pm = line.match(/pinMode\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)/);
      if (pm) {
        this.onLog(`pinMode(${this.resolveValue(pm[1])}, ${pm[2]})`, 'info');
        continue;
      }

      // Serial.begin
      if (line.includes('Serial.begin')) {
        const baud = line.match(/Serial\.begin\s*\(\s*(\d+)\s*\)/);
        this.onLog(`Serial initialized @ ${baud?.[1] || '9600'} baud`, 'success');
        continue;
      }
    }

    return totalDelay;
  }

  resolveValue(val) {
    if (val === undefined || val === null) return 0;
    const str = String(val).trim();
    if (!isNaN(str)) return Number(str);
    if (this.variables[str] !== undefined) return this.variables[str];
    if (str === 'HIGH') return 1;
    if (str === 'LOW') return 0;
    if (str === 'true') return 1;
    if (str === 'false') return 0;
    return 0;
  }

  async run(code) {
    this.stop();
    this.running = true;
    this.pinStates = {};
    this.variables = {};

    this.onLog('[SYS] Compiling sketch...', 'info');
    const { setup, loop } = this.parseCode(code);

    if (!setup && !loop) {
      this.onLog('[ERROR] No setup() or loop() found in sketch.', 'error');
      return;
    }

    // Run setup once
    if (setup) {
      this.onLog('[SYS] Running setup()...', 'success');
      this.executeBlock(setup);
    }

    // Run loop repeatedly
    if (loop) {
      this.onLog('[SYS] Starting loop()...', 'success');
      const runLoop = () => {
        if (!this.running) return;
        const delay = this.executeBlock(loop);
        const interval = Math.max(100, delay); // min 100ms
        this.loopTimer = setTimeout(runLoop, interval);
      };
      runLoop();
    }
  }

  stop() {
    this.running = false;
    clearTimeout(this.loopTimer);
    this.onLog('[SYS] Sketch stopped.', 'warn');
  }
}

// Default starter sketches
export const SKETCH_TEMPLATES = {
  'Blink LED': `// Blink an LED connected to pin 13
const int LED = 13;

void setup() {
  Serial.begin(9600);
  pinMode(LED, OUTPUT);
  Serial.println("LED Blink Ready");
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(1000);
  digitalWrite(LED, LOW);
  delay(1000);
}`,

  'Fade LED (PWM)': `// Fade LED using analogWrite on pin 9
const int LED = 9;
int brightness = 0;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  analogWrite(LED, brightness);
  delay(10);
  brightness = brightness + 5;
  if (brightness > 255) {
    brightness = 0;
  }
}`,

  'Multi LED': `// Control 3 LEDs on pins 11, 12, 13
void setup() {
  pinMode(11, OUTPUT);
  pinMode(12, OUTPUT);
  pinMode(13, OUTPUT);
  Serial.begin(9600);
  Serial.println("Multi LED Ready");
}

void loop() {
  digitalWrite(11, HIGH);
  delay(500);
  digitalWrite(12, HIGH);
  delay(500);
  digitalWrite(13, HIGH);
  delay(500);
  digitalWrite(11, LOW);
  digitalWrite(12, LOW);
  digitalWrite(13, LOW);
  delay(1000);
}`,

  'Empty Sketch': `void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:

}`,
};

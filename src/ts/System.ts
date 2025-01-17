import { Memory } from "./Memory";
import { CPU } from "./CPU";
import { PPU } from "./PPU";
import { loadROM, loadStoredROM } from "./ROMReader";

export const SystemState = { cycles: 7 };
export const cpu_memory = new Memory(0x10000);
export const cpu = new CPU(cpu_memory);
export const ppu_memory = new Memory(0x3FFF);
let ppu: PPU;
let chromPPU: PPU;
let lastFrameTime = 0;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;
let isRunning = false;
let isDebugMode = getCookie('debugMode') === 'true';
let animationFrameId: number | null = null;

function setCookie(name: string, value: string, days: number) {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

function getCookie(name: string) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
// we are currently good to cycle 26
function runEmulator(timestamp: number) {
  if (!isRunning) return;

  const deltaTime = timestamp - lastFrameTime;
  if (deltaTime >= FRAME_DURATION) {
    lastFrameTime = timestamp;
    // Execute a fixed number of CPU instructions per frame
    if (!isDebugMode) {
      for (let i = 0; i < 29781; i++) {
	if (SystemState.cycles == 18432) {
	  return;
	}
	// this is rather hacky way to set the PPU_Status_2002 bit
	if (SystemState.cycles == 27400 ) {
	  cpu_memory.write(0x2002, 0x80);
	}

	if (SystemState.cycles == 57177) {
	  cpu_memory.write(0x2002, 0x80);
	}
	cpu.step();
        cpu.updateUI(); // Update UI after each CPU step
      }
      ppu.render();
    }
  }

  if (!isDebugMode) {
    animationFrameId = requestAnimationFrame(runEmulator);
  }
}

function stepEmulator(cycles: number | undefined) {
  if (isDebugMode) {
    if (cycles === undefined || isNaN(cycles) || cycles <= 0) {
      cpu.step();
      cpu.updateUI(); // Update UI after each CPU step
      ppu.render();
    } else {
      let initialCycles = SystemState.cycles;
      while (SystemState.cycles - initialCycles < cycles) {
        cpu.step();
        cpu.updateUI(); // Update UI after each CPU step
        ppu.render();
      }
    }
  }
}

function stopEmulator() {
  isRunning = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function startEmulator() {
  cpu.reset();
  cpu.updateUI();
  const chrRomCanvas = document.getElementById('chrRomCanvas') as HTMLCanvasElement;
  chromPPU = new PPU(ppu_memory, chrRomCanvas, 'chrrom');
  chromPPU.renderCHRROM();
  if (!isRunning) {
    isRunning = true;
    if (!isDebugMode) {
      animationFrameId = requestAnimationFrame(runEmulator);
    }
  }
}

async function loadAndStartROM(file: File) {
  try {
    const rom = await loadROM(file);
    // load the prgrom into memory
    cpu_memory.loadROM(rom.prgROM, 0x8000);
    cpu_memory.loadROM(rom.prgROM, 0xC000);
    ppu_memory.loadROM(rom.chrROM, 0x0000);
    const canvas = document.getElementById('nes-canvas') as HTMLCanvasElement;
    ppu = new PPU(ppu_memory, canvas);
    // turn this back on to do full emulation
    // render chrROM
    startEmulator();
  } catch (error) {
    console.error('Failed to load ROM:', error);
  }
}

const romInputElement = document.getElementById('rom-input') as HTMLInputElement;
const stopButton = document.getElementById('stop-button') as HTMLButtonElement;
const reloadButton = document.getElementById('reload-button') as HTMLButtonElement;
const debugModeCheckbox = document.getElementById('debug-mode-checkbox') as HTMLInputElement;
const stepButton = document.getElementById('step-button') as HTMLButtonElement;
const cyclesInput = document.getElementById('cycles-input') as HTMLInputElement;
const errorMessage = document.getElementById('error-message') as HTMLDivElement;

if (romInputElement && stopButton && reloadButton && debugModeCheckbox && stepButton) {
  romInputElement.addEventListener('change', (event) => {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      loadAndStartROM(fileInput.files[0]);
    }
  });

  stopButton.addEventListener('click', () => {
    stopEmulator();
  });

  reloadButton.addEventListener('click', () => {
    if (romInputElement.files && romInputElement.files.length > 0) {
      loadAndStartROM(romInputElement.files[0]);
    } else {
      console.error('No ROM file selected');
    }
  });

  debugModeCheckbox.addEventListener('change', (event) => {
    isDebugMode = (event.target as HTMLInputElement).checked;
    setCookie('debugMode', isDebugMode.toString(), 30);
    if (isDebugMode) {
      stopEmulator();
      stepButton.disabled = false;
    } else {
      startEmulator();
      stepButton.disabled = true;
    }
  });

  stepButton.addEventListener('click', () => {
    const cycles = parseInt(cyclesInput.value, 10);
    if (cyclesInput.value !== '' && (isNaN(cycles) || cycles <= 0)) {
      errorMessage.textContent = 'Please enter a valid number of cycles.';
    } else {
      errorMessage.textContent = '';
      stepEmulator(cycles);
    }
  });

  // Initialize debug mode based on cookie value
  debugModeCheckbox.checked = isDebugMode;
  stepButton.disabled = !isDebugMode;
} else {
  console.error('Failed to find one or more required elements.');
}

export async function loadAndStartROMAutomatically() {
  let romData = loadStoredROM();

  if (!romData) {
    console.log("there is no data, please load a ROM first")
  }

  // Proceed with starting the emulator using romData
  if (romData) {
    console.log("Loading Previously Used ROM");
    cpu_memory.loadROM(romData.prgROM, 0x8000);
    cpu_memory.loadROM(romData.prgROM, 0xC000);
    ppu_memory.loadROM(romData.chrROM, 0x0000);

    const canvas = document.getElementById('nes-canvas') as HTMLCanvasElement;
    ppu = new PPU(ppu_memory, canvas);
    cpu.reset();

    // Optional: Render CHR-ROM
    const chrRomCanvas = document.getElementById('chrRomCanvas') as HTMLCanvasElement;
    chromPPU = new PPU(ppu_memory, chrRomCanvas, 'chrrom');
    chromPPU.renderCHRROM();

    startEmulator();
  }
}

loadAndStartROMAutomatically();
(window as any).memory = cpu_memory;
(window as any).cpu = cpu;
(window as any).ppu = ppu;
(window as any).chromPPU = chromPPU;

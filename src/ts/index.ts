import { Memory } from "./Memory";
import { CPU } from "./CPU";
import { PPU } from "./PPU";
import { loadROM, loadStoredROM } from "./ROMReader";

export const cpu_memory = new Memory(0x10000);
export const cpu = new CPU(cpu_memory);
export const ppu_memory = new Memory(0x3FFF);
let ppu: PPU;
let chromPPU: PPU;
let lastFrameTime = 0;
const FPS = 60;
const FRAME_DURATION = 1000 / FPS;
let isRunning = false;
let animationFrameId: number | null = null;

function runEmulator(timestamp: number) {
  if (!isRunning) return;

  const deltaTime = timestamp - lastFrameTime;
  if (deltaTime >= FRAME_DURATION) {
    lastFrameTime = timestamp;
    // Execute a fixed number of CPU instructions per frame
    for (let i = 0; i < 29781; i++) {
      cpu.step();
      cpu.updateUI(); // Update UI after each CPU step

    }
    ppu.render();
  }
  animationFrameId = requestAnimationFrame(runEmulator);
}

function stopEmulator() {
  isRunning = false;
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

function startEmulator() {
  if (!isRunning) {
    isRunning = true;
    animationFrameId = requestAnimationFrame(runEmulator);
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
    cpu.reset();
    // turn this back on to do full emulation
    // render chrROM
    const chrRomCanvas = document.getElementById('chrRomCanvas') as HTMLCanvasElement;
    chromPPU = new PPU(ppu_memory, chrRomCanvas, 'chrrom');
    chromPPU.renderCHRROM();
    startEmulator();
  } catch (error) {
    console.error('Failed to load ROM:', error);
  }
}

const romInputElement = document.getElementById('rom-input') as HTMLInputElement;
const stopButton = document.getElementById('stop-button') as HTMLButtonElement;
const reloadButton = document.getElementById('reload-button') as HTMLButtonElement;

if (romInputElement && stopButton && reloadButton) {
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
(window as any).chromPPU =  chromPPU;

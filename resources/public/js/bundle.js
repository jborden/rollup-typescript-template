
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function (exports) {
    'use strict';

    class Memory {
        constructor(size) {
            this.data = new Uint8Array(size);
        }
        read(address) {
            return this.data[address];
        }
        readHex(address) {
            const value = this.read(address);
            return '0x' + value.toString(16).padStart(2, '0').toUpperCase();
        }
        write(address, value) {
            this.data[address] = value;
        }
        loadROM(rom, startAddress = 0x8000, CPU = true) {
            if (CPU) {
                // Load PRG-ROM into memory
                this.data.set(rom.prgROM, startAddress);
            }
            // load character rom into memory
            else {
                this.data.set(rom.chrROM, startAddress);
            }
        }
        // loadROM(rom: Uint8Array, startAddress: number = 0x8000): void {
        //   this.data.set(rom, startAddress);
        // }
        // Add method to read 16-bit little-endian address
        read16(address) {
            return this.read(address) | (this.read(address + 1) << 8);
        }
    }

    var AddressingMode;
    (function (AddressingMode) {
        AddressingMode[AddressingMode["Implied"] = 0] = "Implied";
        AddressingMode[AddressingMode["Accumulator"] = 1] = "Accumulator";
        AddressingMode[AddressingMode["Immediate"] = 2] = "Immediate";
        AddressingMode[AddressingMode["ZeroPage"] = 3] = "ZeroPage";
        AddressingMode[AddressingMode["ZeroPageX"] = 4] = "ZeroPageX";
        AddressingMode[AddressingMode["ZeroPageY"] = 5] = "ZeroPageY";
        AddressingMode[AddressingMode["Relative"] = 6] = "Relative";
        AddressingMode[AddressingMode["Absolute"] = 7] = "Absolute";
        AddressingMode[AddressingMode["AbsoluteX"] = 8] = "AbsoluteX";
        AddressingMode[AddressingMode["AbsoluteY"] = 9] = "AbsoluteY";
        AddressingMode[AddressingMode["Indirect"] = 10] = "Indirect";
        AddressingMode[AddressingMode["IndexedIndirect"] = 11] = "IndexedIndirect";
        AddressingMode[AddressingMode["IndirectIndexed"] = 12] = "IndirectIndexed";
    })(AddressingMode || (AddressingMode = {}));
    const INSTRUCTION_SET = {
        0xA5: { bytes: 2, addressingMode: AddressingMode.ZeroPage },
        0xC9: { bytes: 2, addressingMode: AddressingMode.Immediate },
        0xF6: { bytes: 2, addressingMode: AddressingMode.ZeroPageX },
        // ... other opcodes ...
    };
    class CPU {
        constructor(memory) {
            // Registers
            this.A = 0; // 8-bit accumulator
            this.X = 0; // 8-bit index register
            this.Y = 0; // 8-bit index register
            this.PC = 0; // 16-bit program counter
            this.S = 0xFF; // 8-bit stack pointer
            this.P = 0; // 7-bit status register
            this.memory = memory;
        }
        reset() {
            this.A = 0;
            this.X = 0;
            this.Y = 0;
            this.S = 0xFF;
            this.P = 0;
            // Set PC to the reset vector
            //this.PC = this.memory.read(0xFFFC) | (this.memory.read(0xFFFD) << 8);
            // this is for nestest.nes
            // most NES programs should start at 0x8000!
            this.PC = 0x80C0;
        }
        step() {
            const instruction = this.fetchInstruction();
            this.executeInstruction(instruction);
        }
        fetchInstruction() {
            const opcode = this.memory.read(this.PC);
            const info = INSTRUCTION_SET[opcode];
            if (!info) {
                throw new Error(`Unknown opcode: ${opcode.toString(16)} at PC: ${this.PC.toString(16)}`);
            }
            const operands = [];
            for (let i = 0; i < info.bytes - 1; i++) {
                operands.push(this.memory.read(this.PC + 1 + i));
            }
            return {
                opcode,
                operands,
                addressingMode: info.addressingMode,
                bytes: info.bytes
            };
        }
        executeInstruction(instruction) {
            // Implement each opcode here
            switch (instruction.opcode) {
                case 0xA5: // LDA Zero Page
                    const zpAddress = instruction.operands[0];
                    this.A = this.memory.read(zpAddress);
                    this.updateZeroAndNegativeFlags(this.A);
                    break;
                case 0xC9: // CMP Immediate
                    instruction.operands[0];
                    //this.compare(this.A, value);
                    break;
                case 0xF6: // INC Zero Page,X
                    const address = (instruction.operands[0] + this.X) & 0xFF;
                    let result = (this.memory.read(address) + 1) & 0xFF;
                    this.memory.write(address, result);
                    this.updateZeroAndNegativeFlags(result);
                    break;
                // ... other opcodes ...
            }
            this.PC += instruction.bytes;
        }
        // private updateZeroAndNegativeFlags(value: number): void {
        //   this.setFlag(CPU.Z, value === 0);
        //   this.setFlag(CPU.N, (value & 0x80) !== 0);
        // }
        updateZeroAndNegativeFlags(value) {
            if (value === 0) {
                this.P |= 0x02; // Set Zero flag
            }
            else {
                this.P &= ~0x02; // Clear Zero flag
            }
            if (value & 0x80) {
                this.P |= 0x80; // Set Negative flag
            }
            else {
                this.P &= ~0x80; // Clear Negative flag
            }
        }
        setFlag(flag, value) {
            if (value) {
                this.P |= (1 << flag);
            }
            else {
                this.P &= ~(1 << flag);
            }
        }
        getFlag(flag) {
            return (this.P & (1 << flag)) !== 0;
        }
        // Debug methods
        getRegisterA() {
            return '0x' + this.padZero(this.A.toString(16), 2).toUpperCase();
        }
        getRegisterX() {
            return '0x' + this.padZero(this.X.toString(16), 2).toUpperCase();
        }
        getRegisterY() {
            return '0x' + this.padZero(this.Y.toString(16), 2).toUpperCase();
        }
        getProgramCounter() {
            return '0x' + this.padZero(this.PC.toString(16), 4).toUpperCase();
        }
        getStackPointer() {
            return '0x' + this.padZero(this.S.toString(16), 2).toUpperCase();
        }
        getStatus() {
            return '0x' + this.padZero(this.P.toString(16), 2).toUpperCase();
        }
        padZero(str, length) {
            while (str.length < length) {
                str = '0' + str;
            }
            return str;
        }
    }
    // Status flag positions
    CPU.C = 0; // Carry
    CPU.Z = 1; // Zero
    CPU.I = 2; // Interrupt disable
    CPU.D = 3; // Decimal
    CPU.B = 4; // Break (only in stack values)
    CPU.V = 6; // Overflow
    CPU.N = 7; // Negative

    class PPU {
        constructor(rom, canvas, mode = 'game') {
            this.palette = [
                0x7C7C7C, 0x0000FC, 0x0000BC, 0x4428BC, 0x940084, 0xA80020, 0xA81000, 0x881400,
                0x503000, 0x007800, 0x006800, 0x005800, 0x004058, 0x000000, 0x000000, 0x000000,
                0xBCBCBC, 0x0078F8, 0x0058F8, 0x6844FC, 0xD800CC, 0xE40058, 0xF83800, 0xE45C10,
                0xAC7C00, 0x00B800, 0x00A800, 0x00A844, 0x008888, 0x000000, 0x000000, 0x000000,
                0xF8F8F8, 0x3CBCFC, 0x6888FC, 0x9878F8, 0xF878F8, 0xF85898, 0xF87858, 0xFCA044,
                0xF8B800, 0xB8F818, 0x58D854, 0x58F898, 0x00E8D8, 0x787878, 0x000000, 0x000000,
                0xFCFCFC, 0xA4E4FC, 0xB8B8F8, 0xD8B8F8, 0xF8B8F8, 0xF8A4C0, 0xF0D0B0, 0xFCE0A8,
                0xF8D878, 0xD8F878, 0xB8F8B8, 0xB8F8D8, 0x00FCFC, 0xF8D8F8, 0x000000, 0x000000
            ];
            this.canvas = canvas;
            this.memory = new Memory(0x10000);
            this.memory.loadROM(rom, 0x0000, false);
            this.context = this.initContext();
            if (mode === 'chrrom') {
                this.canvas.width = 128; // 16 tiles * 8 pixels
                this.canvas.height = 128; // 16 tiles * 8 pixels
                this.imageData = this.context.createImageData(128, 128);
            }
            else {
                this.imageData = this.context.createImageData(256, 240);
            }
        }
        setMode(mode) {
            if (mode === 'chrrom') {
                this.canvas.width = 128;
                this.canvas.height = 128;
                this.imageData = this.context.createImageData(128, 128);
            }
            else {
                this.canvas.width = 256;
                this.canvas.height = 240;
                this.imageData = this.context.createImageData(256, 240);
            }
        }
        initContext() {
            const context = this.canvas.getContext('2d');
            if (context === null) {
                throw new Error('Unable to get 2D context');
            }
            return context;
        }
        render() {
            for (let y = 0; y < 30; y++) {
                for (let x = 0; x < 32; x++) {
                    const tileIndex = this.memory.read(0x2000 + y * 32 + x);
                    const attributeByte = this.memory.read(0x23C0 + (y >> 2) * 8 + (x >> 2));
                    const paletteIndex = (attributeByte >> ((y & 2) << 1 | (x & 2))) & 0x3;
                    this.renderTile(x, y, tileIndex, paletteIndex);
                }
            }
            // Render sprites (simplified)
            for (let i = 0; i < 64; i++) {
                const y = this.memory.read(0x200 + i * 4) + 1;
                const tileIndex = this.memory.read(0x201 + i * 4);
                const attributes = this.memory.read(0x202 + i * 4);
                const x = this.memory.read(0x203 + i * 4);
                this.renderSprite(x, y, tileIndex, attributes & 0x3);
            }
            this.context.putImageData(this.imageData, 0, 0);
        }
        renderTile(tileX, tileY, tileIndex, paletteIndex) {
            const tileAddress = tileIndex * 16;
            for (let y = 0; y < 8; y++) {
                const low = this.memory.read(tileAddress + y);
                const high = this.memory.read(tileAddress + y + 8);
                for (let x = 0; x < 8; x++) {
                    const color = ((high >> (7 - x)) & 1) << 1 | ((low >> (7 - x)) & 1);
                    const paletteAddress = 0x3F00 + paletteIndex * 4 + color;
                    const colorIndex = this.memory.read(paletteAddress) & 0x3F;
                    const screenX = tileX * 8 + x;
                    const screenY = tileY * 8 + y;
                    if (screenX < 256 && screenY < 240) {
                        this.setPixel(screenX, screenY, this.palette[colorIndex]);
                    }
                }
            }
        }
        renderSprite(x, y, tileIndex, paletteIndex) {
            const tileAddress = tileIndex * 16;
            for (let tileY = 0; tileY < 8; tileY++) {
                const low = this.memory.read(tileAddress + tileY);
                const high = this.memory.read(tileAddress + tileY + 8);
                for (let tileX = 0; tileX < 8; tileX++) {
                    const color = ((high >> (7 - tileX)) & 1) << 1 | ((low >> (7 - tileX)) & 1);
                    if (color !== 0) { // Transparent if color == 0
                        const paletteAddress = 0x3F10 + paletteIndex * 4 + color;
                        const colorIndex = this.memory.read(paletteAddress) & 0x3F;
                        const screenX = x + tileX;
                        const screenY = y + tileY;
                        if (screenX < 256 && screenY < 240) {
                            this.setPixel(screenX, screenY, this.palette[colorIndex]);
                        }
                    }
                }
            }
        }
        renderCHRROM() {
            const tileSize = 8;
            const tilesPerRow = 16;
            const numTiles = 256; // 256 tiles in one pattern table
            for (let i = 0; i < numTiles; i++) {
                const tileAddress = i * 16;
                const x = (i % tilesPerRow) * tileSize;
                const y = Math.floor(i / tilesPerRow) * tileSize;
                for (let tileY = 0; tileY < 8; tileY++) {
                    const low = this.memory.read(tileAddress + tileY);
                    const high = this.memory.read(tileAddress + tileY + 8);
                    for (let tileX = 0; tileX < 8; tileX++) {
                        const color = ((high >> (7 - tileX)) & 1) << 1 | ((low >> (7 - tileX)) & 1);
                        // Use grayscale for simplicity
                        const grayScale = color * 85; // 0, 85, 170, or 255
                        this.setPixel(x + tileX, y + tileY, (grayScale << 16) | (grayScale << 8) | grayScale);
                    }
                }
            }
            this.context.putImageData(this.imageData, 0, 0);
        }
        setPixel(x, y, color) {
            const index = (y * 256 + x) * 4;
            this.imageData.data[index] = (color >> 16) & 0xFF; // Red
            this.imageData.data[index + 1] = (color >> 8) & 0xFF; // Green
            this.imageData.data[index + 2] = color & 0xFF; // Blue
            this.imageData.data[index + 3] = 255; // Alpha
        }
    }

    // export async function loadROM(file: File): Promise<Uint8Array> {
    //   return new Promise((resolve, reject) => {
    //     const reader = new FileReader();
    //     reader.onload = () => {
    //       const arrayBuffer = reader.result as ArrayBuffer;
    //       resolve(new Uint8Array(arrayBuffer));
    //     };
    //     reader.onerror = reject;
    //     reader.readAsArrayBuffer(file);
    //   });
    // }
    async function loadROM(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arrayBuffer = reader.result;
                const fullROM = new Uint8Array(arrayBuffer);
                // Check for NES header
                if (fullROM[0] !== 0x4E || fullROM[1] !== 0x45 || fullROM[2] !== 0x53 || fullROM[3] !== 0x1A) {
                    reject(new Error('Invalid NES ROM header'));
                    return;
                }
                // Extract PRG-ROM and CHR-ROM sizes from header
                const prgROMSize = fullROM[4] * 16384; // 16 KB units
                const chrROMSize = fullROM[5] * 8192; // 8 KB units
                // Extract PRG-ROM and CHR-ROM data
                const prgROM = fullROM.slice(16, 16 + prgROMSize);
                const chrROM = fullROM.slice(16 + prgROMSize, 16 + prgROMSize + chrROMSize);
                resolve({ prgROM, chrROM });
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    const memory = new Memory(0x10000);
    const cpu = new CPU(memory);
    let ppu;
    let chromPPU;
    let lastFrameTime = 0;
    const FPS = 60;
    const FRAME_DURATION = 1000 / FPS;
    let isRunning = false;
    let animationFrameId = null;
    function runEmulator(timestamp) {
        if (!isRunning)
            return;
        const deltaTime = timestamp - lastFrameTime;
        if (deltaTime >= FRAME_DURATION) {
            lastFrameTime = timestamp;
            // Execute a fixed number of CPU instructions per frame
            for (let i = 0; i < 29781; i++) {
                cpu.step();
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
    async function loadAndStartROM(file) {
        try {
            const rom = await loadROM(file);
            memory.loadROM(rom);
            const canvas = document.getElementById('nes-canvas');
            ppu = new PPU(rom, canvas);
            cpu.reset();
            // turn this back on to do full emulation
            // render chrROM
            const chrRomCanvas = document.getElementById('chrRomCanvas');
            chromPPU = new PPU(rom, chrRomCanvas, 'chrrom');
            chromPPU.renderCHRROM();
            startEmulator();
        }
        catch (error) {
            console.error('Failed to load ROM:', error);
        }
    }
    const romInputElement = document.getElementById('rom-input');
    const stopButton = document.getElementById('stop-button');
    const reloadButton = document.getElementById('reload-button');
    if (romInputElement && stopButton && reloadButton) {
        romInputElement.addEventListener('change', (event) => {
            const fileInput = event.target;
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
            }
            else {
                console.error('No ROM file selected');
            }
        });
    }
    else {
        console.error('Failed to find one or more required elements.');
    }
    window.memory = memory;
    window.cpu = cpu;
    window.ppu = ppu;
    window.chromPPU = chromPPU;

    exports.cpu = cpu;
    exports.memory = memory;

    return exports;

})({});

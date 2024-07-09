
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
        loadROM(rom, startAddress = 0x8000) {
            this.data.set(rom, startAddress);
        }
    }

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
            this.PC = 0xC000;
        }
        step() {
            const opcode = this.memory.read(this.PC++);
            this.executeInstruction(opcode);
        }
        executeInstruction(opcode) {
            switch (opcode) {
                case 0xA9: // LDA Immediate
                    this.A = this.memory.read(this.PC++);
                    this.updateZeroAndNegativeFlags(this.A);
                    break;
                case 0x8D: // STA Absolute
                    const address = this.memory.read(this.PC++) | (this.memory.read(this.PC++) << 8);
                    this.memory.write(address, this.A);
                    break;
                //Add more opcodes here...
                // default:
                //   console.log(`Unknown opcode: ${opcode.toString(16)}`);
            }
        }
        updateZeroAndNegativeFlags(value) {
            this.setFlag(CPU.Z, value === 0);
            this.setFlag(CPU.N, (value & 0x80) !== 0);
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
        constructor(memory, canvas) {
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
            this.memory = memory;
            this.canvas = canvas;
            this.context = this.initContext();
            this.imageData = this.context.createImageData(256, 240);
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
        setPixel(x, y, color) {
            const index = (y * 256 + x) * 4;
            this.imageData.data[index] = (color >> 16) & 0xFF; // Red
            this.imageData.data[index + 1] = (color >> 8) & 0xFF; // Green
            this.imageData.data[index + 2] = color & 0xFF; // Blue
            this.imageData.data[index + 3] = 255; // Alpha
        }
    }

    async function loadROM(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arrayBuffer = reader.result;
                resolve(new Uint8Array(arrayBuffer));
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    const foo = 'foo';
    const memory = new Memory(0x10000);
    const canvas = document.getElementById('nes-canvas');
    const cpu = new CPU(memory);
    const ppu = new PPU(memory, canvas);
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
            cpu.reset();
            // turn this back on to do full emulation
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

    exports.cpu = cpu;
    exports.foo = foo;
    exports.memory = memory;
    exports.ppu = ppu;

    return exports;

})({});

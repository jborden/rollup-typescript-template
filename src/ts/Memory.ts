export class Memory {
  private data: Uint8Array;

  constructor(size: number) {
    this.data = new Uint8Array(size);
  }

  read(address: number): number {
    return this.data[address];
  }

  readHex(address: number): string {
    const value = this.read(address);
    return '0x' + value.toString(16).padStart(2, '0').toUpperCase();
  }
  
  write(address: number, value: number): void {
    this.data[address] = value;
  }

  loadROM(rom: { prgROM: Uint8Array, chrROM: Uint8Array }, startAddress: number =  0x8000, CPU: boolean = true): void {
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
  read16(address: number): number {
    return this.read(address) | (this.read(address + 1) << 8);
  }
  
}

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

  loadROM(rom: Uint8Array, startAddress: number = 0x8000): void {
    this.data.set(rom, startAddress);
  }
}

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

  loadROM(memory: Uint8Array, startAddress: number): void {
    try {
          this.data.set(memory, startAddress);
    } catch (error) {
      console.error('Memory failed to load ROM at startAddress ' + startAddress )
    }

  }

  // Add method to read 16-bit little-endian address
  read16(address: number): number {
    return this.read(address) | (this.read(address + 1) << 8);
  }
  
}

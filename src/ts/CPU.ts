import { Memory } from "./Memory";

export class CPU {
  // Registers
  private A: number = 0;   // 8-bit accumulator
  private X: number = 0;   // 8-bit index register
  private Y: number = 0;   // 8-bit index register
  private PC: number = 0;  // 16-bit program counter
  private S: number = 0xFF; // 8-bit stack pointer
  private P: number = 0;   // 7-bit status register

  // Status flag positions
  private static C = 0; // Carry
  private static Z = 1; // Zero
  private static I = 2; // Interrupt disable
  private static D = 3; // Decimal
  private static B = 4; // Break (only in stack values)
  private static V = 6; // Overflow
  private static N = 7; // Negative

  private memory: Memory;

  constructor(memory: Memory) {
    this.memory = memory;
  }

  reset(): void {
    this.A = 0;
    this.X = 0;
    this.Y = 0;
    this.S = 0xFF;
    this.P = 0;
    // Set PC to the reset vector
    //this.PC = this.memory.read(0xFFFC) | (this.memory.read(0xFFFD) << 8);
    this.PC = 0xC000;
  }

  step(): void {
    const opcode = this.memory.read(this.PC++);
    this.executeInstruction(opcode);
  }

  private executeInstruction(opcode: number): void {
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

  private updateZeroAndNegativeFlags(value: number): void {
    this.setFlag(CPU.Z, value === 0);
    this.setFlag(CPU.N, (value & 0x80) !== 0);
  }

  private setFlag(flag: number, value: boolean): void {
    if (value) {
      this.P |= (1 << flag);
    } else {
      this.P &= ~(1 << flag);
    }
  }

  private getFlag(flag: number): boolean {
    return (this.P & (1 << flag)) !== 0;
  }

  // Debug methods
  getRegisterA(): string {
    return '0x' + this.padZero(this.A.toString(16), 2).toUpperCase();
  }

  getRegisterX(): string {
    return '0x' + this.padZero(this.X.toString(16), 2).toUpperCase();
  }

  getRegisterY(): string {
    return '0x' + this.padZero(this.Y.toString(16), 2).toUpperCase();
  }

  getProgramCounter(): string {
    return '0x' + this.padZero(this.PC.toString(16), 4).toUpperCase();
  }

  getStackPointer(): string {
    return '0x' + this.padZero(this.S.toString(16), 2).toUpperCase();
  }

  getStatus(): string {
    return '0x' + this.padZero(this.P.toString(16), 2).toUpperCase();
  }

  private padZero(str: string, length: number): string {
    while (str.length < length) {
      str = '0' + str;
    }
    return str;
  }
}

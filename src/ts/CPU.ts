import { Memory } from "./Memory";
 interface Instruction {
	opcode: number;
	operands: number[];
	addressingMode: AddressingMode;
	bytes: number;
  }

  enum AddressingMode {
	Implied,
	Accumulator,
	Immediate,
	ZeroPage,
	ZeroPageX,
	ZeroPageY,
	Relative,
	Absolute,
	AbsoluteX,
	AbsoluteY,
	Indirect,
	IndexedIndirect,
	IndirectIndexed
  }

  const INSTRUCTION_SET: { [opcode: number]: { bytes: number, addressingMode: AddressingMode } } = {
    0xA5: { bytes: 2, addressingMode: AddressingMode.ZeroPage },
    0xC9: { bytes: 2, addressingMode: AddressingMode.Immediate },
    0xF6: { bytes: 2, addressingMode: AddressingMode.ZeroPageX },
    0x4C: { bytes: 3, addressingMode: AddressingMode.Absolute }
    // ... other opcodes ...
  };


export class CPU {
  private memory: Memory;
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
     // Read the reset vector from 0xFFFC and 0xFFFD
    const lowByte = this.memory.read(0xFFFC);
    const highByte = this.memory.read(0xFFFD);
    this.PC = (highByte << 8) | lowByte;
    // this is for nestest.nes
    // most NES programs should start at 0x8000!
    this.PC = 0x8000;
  }
  
  step(): void {
    const instruction = this.fetchInstruction();
    this.executeInstruction(instruction);
  }

  private fetchInstruction(): Instruction {
    const opcode = this.memory.read(this.PC);
    const info = INSTRUCTION_SET[opcode];
    
    if (!info) {
      throw new Error(`Unknown opcode: ${opcode.toString(16)} at PC: ${this.PC.toString(16)}`);
    }

    const operands: number[] = [];
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
  
  private executeInstruction(instruction: Instruction): void {
    // Implement each opcode here
    switch (instruction.opcode) {
      case 0xA5:  // LDA Zero Page
        const zpAddress = instruction.operands[0];
        this.A = this.memory.read(zpAddress);
        this.updateZeroAndNegativeFlags(this.A);
	return;
      case 0xC9:  // CMP Immediate
        const value = instruction.operands[0];
        //this.compare(this.A, value);
	return;
      case 0xF6:  // INC Zero Page,X
        const address = (instruction.operands[0] + this.X) & 0xFF;
        let result = (this.memory.read(address) + 1) & 0xFF;
        this.memory.write(address, result);
        this.updateZeroAndNegativeFlags(result);
	return;
      case 0x4C:  // JMP Absolute
	const lowByte = instruction.operands[0];
	const highByte = instruction.operands[1];
	const jumpAddress = (highByte << 8) | lowByte;
	console.log(`Jumping to address: ${jumpAddress.toString(16)}`);
	this.PC = jumpAddress;
	return;
      // ... other opcodes ...
    }

    this.PC += instruction.bytes;
  }
  // private updateZeroAndNegativeFlags(value: number): void {
  //   this.setFlag(CPU.Z, value === 0);
  //   this.setFlag(CPU.N, (value & 0x80) !== 0);
  // }
  private updateZeroAndNegativeFlags(value: number): void {
    if (value === 0) {
      this.P |= 0x02; // Set Zero flag
    } else {
      this.P &= ~0x02; // Clear Zero flag
    }
    if (value & 0x80) {
      this.P |= 0x80; // Set Negative flag
    } else {
      this.P &= ~0x80; // Clear Negative flag
    }
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



import { Memory } from "./Memory";
 interface Instruction {
   opcode: number;
   operands: number[];
   addressingMode: AddressingMode;
   bytes: number;
   cycles: number;
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

const INSTRUCTION_SET: { [opcode: number]: { bytes: number, addressingMode: AddressingMode, cycles: number } } = {
  0xA5: { bytes: 2, addressingMode: AddressingMode.ZeroPage, cycles: 3 },
  0xC9: { bytes: 2, addressingMode: AddressingMode.Immediate, cycles: 2 },
  0xF6: { bytes: 2, addressingMode: AddressingMode.ZeroPageX, cycles: 6 },
  0x4C: { bytes: 3, addressingMode: AddressingMode.Absolute, cycles: 3 },
  0x78: { bytes: 1, addressingMode: AddressingMode.Implied, cycles: 2 },
  0xD8: { bytes: 1, addressingMode: AddressingMode.Implied, cycles: 2 },
  0xA2: { bytes: 2, addressingMode: AddressingMode.Immediate, cycles: 2 },
  0x9A: { bytes: 1, addressingMode: AddressingMode.Implied, cycles: 2 },
  0xAD: { bytes: 3, addressingMode: AddressingMode.Absolute, cycles: 4}
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
  private C = 0; // Carry
  private Z = 1; // Zero
  private I = 2; // Interrupt disable
  private D = 3; // Decimal
  private B = 4; // Break (only in stack values)
  private V = 6; // Overflow
  private N = 7; // Negative

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
    //this.PC = 0x8000;
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
    let lowByte: number;
    let highByte: number;
    let address: number;
    let result: number;
    let immediateValue: number;
    let jumpAddress: number;
    let zpAddress: number;
    switch (instruction.opcode) {
      case 0xA5:  // LDA Zero Page
        zpAddress = instruction.operands[0];
        this.A = this.memory.read(zpAddress);
        this.updateZeroAndNegativeFlags(this.A);
	break;
      case 0xF6:  // INC Zero Page,X
        address = (instruction.operands[0] + this.X) & 0xFF;
        result = (this.memory.read(address) + 1) & 0xFF;
        this.memory.write(address, result);
        this.updateZeroAndNegativeFlags(result);
	break;
      case 0x4C:  // JMP Absolute
	lowByte = instruction.operands[0];
	highByte = instruction.operands[1];
	jumpAddress = (highByte << 8) | lowByte;
	console.log(`Jumping to address: ${jumpAddress.toString(16)}`);
	this.PC = jumpAddress;
	break;
      case 0x78: // Set Interrupt Disable Status
	this.I = 1;
	break;
      case 0xD8: // Clear Decimal Mode
	this.D = 0;
	break;
      case 0xA2: // LDX - load X with memory ldx #oper
        immediateValue = instruction.operands[0];
        this.X = immediateValue;
        this.updateZeroAndNegativeFlags(this.X);
        break;
      case 0x9A: // TSX - Transfer Index X to Stack Register
	this.S = this.X;
	break;
      case 0xAD: // LDA oper - Load Accumulator with Memory
	lowByte = instruction.operands[0];
	highByte = instruction.operands[1];
	address = (highByte << 8) | lowByte;
	this.A = this.memory.read(address);
	this.updateZeroAndNegativeFlags(this.A);
	break;
      // ... other opcodes ...
    }

    this.PC += instruction.bytes;
  }
  // private updateZeroAndNegativeFlags(value: number): void {
  //   this.setFlag(CPU.Z, value === 0);
  //   this.setFlag(CPU.N, (value & 0x80) !== 0);
  // }

  private updateZeroAndNegativeFlags(value: number): void {
    // Update Zero flag
    if (value === 0) {
      this.P |= (1 << this.Z);
    } else {
      this.P &= ~(1 << this.Z);
    }

    // Update Negative flag
    if (value & 0x80) {
      this.P |= (1 << this.N);
    } else {
      this.P &= ~(1 << this.N);
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



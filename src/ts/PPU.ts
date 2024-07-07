import { Memory } from './Memory'

export class PPU {
  private memory: Memory;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private imageData: ImageData;
  private palette: number[] = [
    0x7C7C7C, 0x0000FC, 0x0000BC, 0x4428BC, 0x940084, 0xA80020, 0xA81000, 0x881400,
    0x503000, 0x007800, 0x006800, 0x005800, 0x004058, 0x000000, 0x000000, 0x000000,
    0xBCBCBC, 0x0078F8, 0x0058F8, 0x6844FC, 0xD800CC, 0xE40058, 0xF83800, 0xE45C10,
    0xAC7C00, 0x00B800, 0x00A800, 0x00A844, 0x008888, 0x000000, 0x000000, 0x000000,
    0xF8F8F8, 0x3CBCFC, 0x6888FC, 0x9878F8, 0xF878F8, 0xF85898, 0xF87858, 0xFCA044,
    0xF8B800, 0xB8F818, 0x58D854, 0x58F898, 0x00E8D8, 0x787878, 0x000000, 0x000000,
    0xFCFCFC, 0xA4E4FC, 0xB8B8F8, 0xD8B8F8, 0xF8B8F8, 0xF8A4C0, 0xF0D0B0, 0xFCE0A8,
    0xF8D878, 0xD8F878, 0xB8F8B8, 0xB8F8D8, 0x00FCFC, 0xF8D8F8, 0x000000, 0x000000
  ];

  constructor(memory: Memory, canvas: HTMLCanvasElement) {
    this.memory = memory;
    this.canvas = canvas;
    this.context = this.initContext();
    this.imageData = this.context.createImageData(256, 240);
  }

  private initContext() {
    const context = this.canvas.getContext('2d');
    if (context === null) {
      throw new Error('Unable to get 2D context');
    }
    return context;
  }

  render(): void {
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

  private renderTile(tileX: number, tileY: number, tileIndex: number, paletteIndex: number): void {
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

  private renderSprite(x: number, y: number, tileIndex: number, paletteIndex: number): void {
    const tileAddress = tileIndex * 16;

    for (let tileY = 0; tileY < 8; tileY++) {
      const low = this.memory.read(tileAddress + tileY);
      const high = this.memory.read(tileAddress + tileY + 8);

      for (let tileX = 0; tileX < 8; tileX++) {
        const color = ((high >> (7 - tileX)) & 1) << 1 | ((low >> (7 - tileX)) & 1);
        if (color !== 0) {  // Transparent if color == 0
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

  private setPixel(x: number, y: number, color: number): void {
    const index = (y * 256 + x) * 4;
    this.imageData.data[index] = (color >> 16) & 0xFF;     // Red
    this.imageData.data[index + 1] = (color >> 8) & 0xFF;  // Green
    this.imageData.data[index + 2] = color & 0xFF;         // Blue
    this.imageData.data[index + 3] = 255;                  // Alpha
  }
}

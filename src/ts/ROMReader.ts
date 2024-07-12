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
export async function loadROM(file: File): Promise<{prgROM: Uint8Array, chrROM: Uint8Array}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const fullROM = new Uint8Array(arrayBuffer);
      
      // Check for NES header
      if (fullROM[0] !== 0x4E || fullROM[1] !== 0x45 || fullROM[2] !== 0x53 || fullROM[3] !== 0x1A) {
        reject(new Error('Invalid NES ROM header'));
        return;
      }

      // Extract PRG-ROM and CHR-ROM sizes from header
      const prgROMSize = fullROM[4] * 0x4000;  // 16 KB units
      const chrROMSize = fullROM[5] * 0x2000;   // 8 KB units

      // Extract PRG-ROM and CHR-ROM data
      const prgROM = fullROM.slice(16, 16 + prgROMSize);
      const chrROM = fullROM.slice(16 + prgROMSize, 16 + prgROMSize + chrROMSize);
      localStorage.setItem('nesPrgROM', JSON.stringify(Array.from(prgROM)));
      localStorage.setItem('nesChrROM', JSON.stringify(Array.from(chrROM)));
      resolve({prgROM, chrROM});
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function loadStoredROM(): { prgROM: Uint8Array, chrROM: Uint8Array } | null {
  const prgROMString = localStorage.getItem('nesPrgROM');
  const chrROMString = localStorage.getItem('nesChrROM');

  if (!prgROMString || !chrROMString) {
    return null;
  }

  const prgROM = new Uint8Array(JSON.parse(prgROMString));
  const chrROM = new Uint8Array(JSON.parse(chrROMString));

  return { prgROM, chrROM };
}

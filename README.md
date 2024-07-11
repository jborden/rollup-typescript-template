# rollup typescript template

This is a template for starting a rollup project. Run the server with 

First make sure the dependencies in package.json are up to date.

Then do a 
```
npm install
```

Run the server with
```
rollup -c -w
```

visit  http://localhost:10001 in the browser. 

You can also edit resources/public/index.html


# NES Resources
https://yizhang82.dev/nes-emu-overview

https://medium.com/@guilospanck/the-journey-of-writing-a-nes-emulator-part-i-the-cpu-6e83b50baa37

NES Test Roms
https://github.com/christopherpow/nes-test-roms/tree/master/other

https://www.nesdev.org/wiki/Emulator_tests - lots of dead links
https://www.qmtpro.com/~nes/misc/nestest.txt - nestest.txt
Opcodes
https://www.masswerk.at/6502/6502_instruction_set.html#STA

ROM explorer
https://nesplorer.vercel.app/

# Notes
Read the first instruction in nestest.nes
```
memory.readHex(0x8000)
```

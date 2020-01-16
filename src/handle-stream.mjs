let exports;

if ("object" === typeof globalThis && globalThis.ReadableStreamDefaultReader) {
  function streamReaderToAsyncIterator(reader) {
    return typeof reader[Symbol.asyncIterator] === "function"
      ? reader
      : {
          next() {
            return reader.read();
          },
          return() {
            return reader.releaseLock();
          },
          [Symbol.asyncIterator]() {
            return this;
          },
        };
  }

  async function* splitAndDecode(uint8ArrayIterator) {
    const EMPTY_ARRAY = Uint8Array.from([]);
    const decoder = new TextDecoder();
    let remainingBits = EMPTY_ARRAY;
    for await (const value of uint8ArrayIterator) {
      let indexOfLineReturn;
      let previousStop = 0;
      while (true) {
        indexOfLineReturn = value.indexOf(10, previousStop);
        if (indexOfLineReturn === -1) {
          remainingBits = value.slice(previousStop);
          break;
        }
        const fullLine = new Uint8Array(
          remainingBits.length + indexOfLineReturn - previousStop
        );
        fullLine.set(remainingBits);
        fullLine.set(
          value.slice(previousStop, indexOfLineReturn),
          remainingBits.length
        );
        previousStop = indexOfLineReturn + 1;
        remainingBits = EMPTY_ARRAY;
        yield decoder.decode(fullLine);
      }
    }

    if (remainingBits.length) {
      yield decoder.decode(remainingBits);
    }
  }

  exports = async (input, processLine) => {
    for await (const line of splitAndDecode(
      streamReaderToAsyncIterator(input)
    )) {
      processLine(line);
    }
  };
} else if (typeof IS_BROWSER === "undefined" || !IS_BROWSER) {
  exports = (input, processLine) =>
    import("readline")
      .then(module => module.default)
      .then(
        readline =>
          new Promise((resolve, reject) => {
            const crlfDelay = Infinity; // \r\n are handled as a single newline
            const lineReader = readline.createInterface({ input, crlfDelay });

            lineReader.on("line", processLine);
            lineReader.on("close", resolve);

            // If the input stream is erroneous or already consumed
            input.on("error", reject);
            input.on("close", reject);
          })
      );
}

export default exports;

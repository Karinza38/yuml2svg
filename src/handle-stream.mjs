let exports;

if (typeof IS_BROWSER === "undefined" || !IS_BROWSER) {
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
} else {
  exports = () => Promise.reject(new Error("Not implemented yet"));
}

export default exports;

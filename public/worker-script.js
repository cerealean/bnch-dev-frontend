// Web Worker script for secure code execution
// This file is loaded as a separate worker and should not import ES modules

// Security context setup - disable dangerous globals
const createSecureContext = (disabledGlobals = []) => {
  const defaultDisabled = [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "importScripts",
    "Worker",
    "SharedWorker",
    "ServiceWorker",
    "navigator",
    "location",
    "history",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "crypto",
    "subtle",
  ];

  const allDisabled = [...new Set([...defaultDisabled, ...disabledGlobals])];

  // Disable globals by setting them to undefined
  allDisabled.forEach((global) => {
    try {
      self[global] = undefined;
    } catch (e) {
      // Some globals might be read-only, ignore those errors
    }
  });
};

// Initialize secure context
createSecureContext();

// CSP enforcement (basic simulation)
const enforceCSP = (csp) => {
  if (csp && csp.includes("default-src 'none'")) {
    // Disable additional globals for stricter CSP
    self.importScripts = undefined;
    self.fetch = undefined;
  }
};

// Message handler for benchmark execution
self.onmessage = function (e) {
  const { code, timeout, csp, id } = e.data;

  try {
    enforceCSP(csp);

    const startTime = performance.now();
    let timeoutId;
    let completed = false;

    const executeCode = () => {
      return new Promise((resolve, reject) => {
        try {
          // Set up timeout
          timeoutId = setTimeout(() => {
            if (!completed) {
              reject(new Error("Execution timeout"));
            }
          }, timeout);

          // Execute the user code
          const result = eval(code);

          if (result instanceof Promise) {
            result.then(resolve).catch(reject);
          } else {
            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      });
    };

    executeCode()
      .then(() => {
        completed = true;
        const endTime = performance.now();
        self.postMessage({
          id,
          success: true,
          time: endTime - startTime,
        });
      })
      .catch((error) => {
        completed = true;
        const endTime = performance.now();
        self.postMessage({
          id,
          success: false,
          time: endTime - startTime,
          error: error.message,
        });
      })
      .finally(() => {
        if (timeoutId) clearTimeout(timeoutId);
      });
  } catch (error) {
    self.postMessage({
      id,
      success: false,
      time: 0,
      error: error.message,
    });
  }
};

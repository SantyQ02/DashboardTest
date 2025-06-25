// Polyfills for @saveapp-org/shared package
if (typeof global === "undefined") {
  (window as any).global = window;
}

if (typeof process === "undefined") {
  (window as any).process = { env: {} };
}

if (typeof Buffer === "undefined") {
  (window as any).Buffer = {
    from: () => new Uint8Array(),
    alloc: () => new Uint8Array(),
    allocUnsafe: () => new Uint8Array(),
  };
}

// Polyfills for browser compatibility
if (typeof global === "undefined") {
  (window as any).global = window;
}

// Add any other polyfills needed for the application
export {};

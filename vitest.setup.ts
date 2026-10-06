import "@testing-library/jest-dom/vitest";

// jsdom has no IntersectionObserver; framer-motion's viewport/useInView hooks
// need one to even mount, so component tests using motion.* elements crash
// without this stub.
class IntersectionObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver;
}

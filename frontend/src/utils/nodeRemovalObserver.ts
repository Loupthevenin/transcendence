// This function create a MutationObserver to detect when the target node is removed
export default function nodeRemovalObserver(targetNode: HTMLElement, callback: () => void): void {
  const observer: MutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
    for (let mutation of mutations) {
      for (let node of mutation.removedNodes) {
        if (node.contains(targetNode)) {
          callback(); // Call the provided callback function
          observer.disconnect(); // Stop observing once cleanup is done
          return; // Exit all loops immediately
        }
      }
    }
  });

  // Start observing changes in the document body
  observer.observe(document.body, { childList: true });
}

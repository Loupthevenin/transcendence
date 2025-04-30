let exit_code: 0 | 1 = 0;

async function launchTest(test: () => Promise<void>, name: string): Promise<void> {
  try {
    await test();
    console.log(`'${name}' test completed successfully.`);
  } catch (error: any) {
    console.error(`Error running '${name}' tests:`, error);
    exit_code = 1;
  }
}

(async () => {
  try {
    const results: [PromiseSettledResult<void>] = await Promise.allSettled([
      // Test the integrity of the tournament manager
      import("./integrityTests/tournament").then(async (module) => {
        await launchTest(module.Test1, "Tournament Manager");
        await launchTest(module.Test2, "Tournament Manager");
        await launchTest(module.Test3, "Tournament Manager");
        await launchTest(module.Test4, "Tournament Manager");
      }),

      /// More tests can be added here ///
      // import("./integrityTests/tournament").then(async (module) => {
      //   await launchTest(module.Test1, "Tournament Manager");
      // }),
    ]);

    // Check if any test failed
    results.forEach((result: PromiseSettledResult<void>) => {
      if (result.status === "rejected") {
        exit_code = 1;
        console.error("A test failed:", result.reason);
      }
    });

    process.exit(exit_code);
  } catch (error: any) {
    console.error("Critical error loading tests:", error);
    process.exit(1);
  }
})();

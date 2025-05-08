import { ethers, run } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  const ScoreStorage = await ethers.getContractFactory("ScoreStorage");

  const contract = await ScoreStorage.deploy();
  await contract.waitForDeployment();

  const address: string = await contract.getAddress();
  console.log("Contrat déployé : ", address);
  try {
    console.log("Verifying contract on Snowtrace...");
    await run("verify:verify", {
      address,
      constructorArguments: [],
    });
    console.log("Contract verified");
  } catch (error) {
    console.error("Vérification failed: ", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });

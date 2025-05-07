import { ethers } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  const ScoreStorage = await ethers.getContractFactory("ScoreStorage");

  const contract = await ScoreStorage.deploy();
  await contract.waitForDeployment();

  const address: string = await contract.getAddress();
  console.log("Contrat déployé : ", address);
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });

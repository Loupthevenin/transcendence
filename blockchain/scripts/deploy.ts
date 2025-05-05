import { ethers } from "hardhat";

async function main(): Promise<void> {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  // const ScoreStorage = await ethers.getContractFactory("ScoreStorage");
  const TestContract = await ethers.getContractFactory("TestContract");

  const contract = await TestContract.deploy();
  await contract.waitForDeployment();

  const address: string = await contract.getAddress();
  console.log("Contrat déployé : ", address);
  console.log("Message initial : ", await contract.message());
}

main()
  .then(() => process.exit(0))
  .catch((error: any) => {
    console.error(error);
    process.exit(1);
  });

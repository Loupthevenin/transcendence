import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  // const ScoreStorage = await ethers.getContractFactory("ScoreStorage");
  const TestContract = await ethers.getContractFactory("TestContract");

  const contract = await TestContract.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("Contrat déployé : ", address);
  console.log("Message initial : ", await contract.message());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

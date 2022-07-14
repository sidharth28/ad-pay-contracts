import { ethers, upgrades } from "hardhat";

async function main() {
  const Adpay = await ethers.getContractFactory("Adpay");
  const ap = await upgrades.deployProxy(Adpay);
  await ap.deployed();

  console.log("Adpay deployed to:", ap.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

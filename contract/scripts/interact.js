const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const HelloWorld = await hre.ethers.getContractFactory("HelloWorld", signer);

  // replace with the address printed by Ignition deploy
  const address = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  // use the provider directly, not Hardhat’s console provider
  const provider = new hre.ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const hello = new hre.ethers.Contract(address, HelloWorld.interface, signer.connect(provider));

  console.log("Greeting before:", await hello.greet());
  const tx = await hello.setGreeting("Hi from script!");
  await tx.wait();
  console.log("Greeting after:", await hello.greet());
}

main().catch(console.error);

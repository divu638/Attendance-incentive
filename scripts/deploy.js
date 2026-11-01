const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const percent = process.env.REQUIRED_PERCENT || 75;
  const reward = hre.ethers.parseEther(process.env.REWARD_ETH || "0.01");
  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const teacher = signers[1];
  const student1 = signers[2];
  const student2 = signers[3];

  const F = await hre.ethers.getContractFactory("AttendanceIncentive");
  const c = await F.deploy(percent, reward);
  await c.waitForDeployment();
  const address = await c.getAddress();

  // Fund the reward pool so students can claim straight away
  const fundEth = process.env.FUND_ETH || "0.5";
  await (await deployer.sendTransaction({ to: address, value: hre.ethers.parseEther(fundEth) })).wait();

  // Setup initial roles for local demo
  if (teacher && student1) {
    console.log("Setting up initial demo accounts...");
    await (await c.addTeacher(teacher.address)).wait();
    await (await c.connect(teacher).registerStudent(student1.address)).wait();
    if (student2) {
      await (await c.connect(teacher).registerStudent(student2.address)).wait();
    }
    await (await c.connect(teacher).createSession("CS401: Blockchain & Smart Contracts")).wait();
  }

  const artifact = await hre.artifacts.readArtifact("AttendanceIncentive");
  const out = { address, chainId: Number((await hre.ethers.provider.getNetwork()).chainId), abi: artifact.abi };

  for (const dir of ["backend", "frontend/src"]) {
    fs.writeFileSync(path.join(__dirname, "..", dir, "contract.json"), JSON.stringify(out, null, 2));
  }
  console.log("AttendanceIncentive deployed to:", address);
  console.log("Admin (deployer):", deployer.address);
  console.log("Teacher (pre-authorized):", teacher.address);
  console.log("Student 1 (registered):", student1.address);
  console.log("ABI + address written to backend/contract.json and frontend/src/contract.json");
}

main().catch((e) => { console.error(e); process.exit(1); });

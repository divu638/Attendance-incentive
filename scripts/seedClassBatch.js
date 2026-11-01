const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const db = require("../backend/db");

// Real class student list provided by user
const STUDENTS = [
  { rollNo: "2329313", name: "DAISY CHAWLA", attendedCount: 5 }, // 100%
  { rollNo: "2329321", name: "DIVYA", attendedCount: 4 },        // 80%
  { rollNo: "2329330", name: "GAZI WAHAB", attendedCount: 4 },     // 80%
  { rollNo: "2445759", name: "GURLEEN SINGH", attendedCount: 5 },  // 100%
  { rollNo: "2329364", name: "KHUSHI KUMARI", attendedCount: 4 },  // 80%
  { rollNo: "2329366", name: "KNISHK ARORA", attendedCount: 3 },   // 60%
  { rollNo: "2329373", name: "MANMEET SINGH VIRDI", attendedCount: 5 }, // 100%
  { rollNo: "2329403", name: "PULANE MASENKANE", attendedCount: 4 },    // 80%
  { rollNo: "2329426", name: "SAHIL KUMAR YADAV", attendedCount: 3 },   // 60%
  { rollNo: "2329292", name: "ANURAG MAURYA", attendedCount: 5 },  // 100%
  { rollNo: "2329294", name: "ARHAM JAIN", attendedCount: 4 },     // 80%
  { rollNo: "2329337", name: "HARLEEN KAUR", attendedCount: 5 },   // 100%
  { rollNo: "2329338", name: "HARMAN KAPOOR", attendedCount: 4 },  // 80%
  { rollNo: "2329347", name: "JASHANDEEP SINGH", attendedCount: 4 }, // 80%
  { rollNo: "2329386", name: "NANISH GUPTA", attendedCount: 3 },   // 60%
  { rollNo: "2329431", name: "SHIVAM ARORA", attendedCount: 5 },   // 100%
  { rollNo: "2329289", name: "ANMOL SINGH", attendedCount: 4 },    // 80%
  { rollNo: "2329376", name: "MIR KAMRAN HASSAN", attendedCount: 4 }, // 80%
  { rollNo: "2329377", name: "ILYASSYN MOHAMED HADJI", attendedCount: 5 }, // 100%
  { rollNo: "2329344", name: "J EMMANUEL SULONTEH JR", attendedCount: 4 }, // 80%
  { rollNo: "2329307", name: "BAVNEET SINGH", attendedCount: 5 },  // 100%
  { rollNo: "2329345", name: "JASANGAD SINGH", attendedCount: 4 }, // 80%
  { rollNo: "2445761", name: "MOHAMMAD AZAD", attendedCount: 5 },  // 100%
  { rollNo: "2329335", name: "GURNADAR KAUR", attendedCount: 4 },  // 80%
  { rollNo: "2329416", name: "RITIKA", attendedCount: 5 },         // 100%
  { rollNo: "2329449", name: "VANSH ARORA", attendedCount: 3 },    // 60%
  { rollNo: "2329298", name: "ARYAN SHARMA", attendedCount: 5 },   // 100%
  { rollNo: "2329319", name: "DEVIKA", attendedCount: 4 },         // 80%
  { rollNo: "2329357", name: "KARAN KUMAR", attendedCount: 4 },    // 80%
  { rollNo: "2329384", name: "NAITIK TIWARI", attendedCount: 5 },  // 100%
  { rollNo: "2329291", name: "ANSHPREET SINGH", attendedCount: 4 },// 80%
  { rollNo: "2329293", name: "ANVI SONI", attendedCount: 5 },      // 100%
  { rollNo: "2329308", name: "BISHWAS B.K", attendedCount: 4 },    // 80%
  { rollNo: "2329314", name: "DAKSH SOOD", attendedCount: 4 },     // 80%
  { rollNo: "2329332", name: "GURBAZ SINGH", attendedCount: 5 },   // 100%
  { rollNo: "2329334", name: "GURJIT SINGH", attendedCount: 4 },   // 80%
  { rollNo: "2329349", name: "JASKARAN SINGH REEHAL", attendedCount: 5 }, // 100%
  { rollNo: "2329370", name: "MALIKA SOOD", attendedCount: 4 },    // 80%
];

const SESSIONS = [
  "CS601: Blockchain Architecture & Cryptographic Primitives",
  "CS602: Ethereum Virtual Machine & Smart Contract Anatomy",
  "CS603: Solidity Security Patterns & Reentrancy Mitigation",
  "CS604: Decentralized Consensus & Proof-of-Stake Verification",
  "CS605: Web3 DApp Engineering & EIP-191 Auth Protocols",
];

async function main() {
  console.log("🚀 Starting Attendify Class Seeding with 38 Real Students...");

  const deployment = require("../backend/contract.json");
  const contractAddress = deployment.address;
  const contract = await hre.ethers.getContractAt("AttendanceIncentive", contractAddress);

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  const teacher = signers[1];

  console.log(`Connected to contract at ${contractAddress}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Teacher: ${teacher.address}`);

  // Setup teacher in contract if not already authorized
  try {
    const isTeacher = await contract.isTeacher(teacher.address);
    if (!isTeacher) {
      console.log("Authorizing teacher on contract...");
      await (await contract.addTeacher(teacher.address)).wait();
    }
  } catch (e) {
    console.log("Teacher authorization check:", e.message);
  }

  // Derive deterministic wallets for all 38 students
  const mnemonic = "test test test test test test test test test test test junk";

  const studentsWithWallets = STUDENTS.map((s, idx) => {
    // Indexes 2 to 39
    const derived = hre.ethers.HDNodeWallet.fromPhrase(mnemonic, undefined, `m/44'/60'/0'/0/${idx + 2}`);
    return {
      ...s,
      index: idx + 2,
      walletAddress: derived.address,
      privateKey: derived.privateKey,
    };
  });

  console.log(`\n📋 Enrolling ${studentsWithWallets.length} students on-chain & in database...`);

  for (const s of studentsWithWallets) {
    // Register on Ethereum smart contract
    try {
      const isReg = await contract.isStudent(s.walletAddress);
      if (!isReg) {
        process.stdout.write(`Registering on-chain: ${s.rollNo} - ${s.name}... `);
        const tx = await contract.connect(teacher).registerStudent(s.walletAddress);
        await tx.wait();
        process.stdout.write("✓\n");
      }
    } catch (e) {
      console.log(`Student ${s.rollNo} register check:`, e.message);
    }

    // Upsert into backend database with student credentials
    const studentEmail = `${s.rollNo}@college.edu`;
    await db.users.upsertProfile(
      s.walletAddress,
      s.name,
      s.rollNo,
      "Computer Science & Engineering",
      "Semester 6",
      studentEmail,
      "student@123",
      s.privateKey
    );
  }

  console.log("✓ All 38 students enrolled successfully!");

  // Ensure faculty profile is recorded
  await db.users.upsertRole(teacher.address, "teacher");
  await db.users.upsertProfile(
    teacher.address,
    "Ms. Sarabjit Kaur",
    "",
    "Department of Engineering Block",
    "",
    "sarabjit.kaur@college.edu",
    "teacher@123"
  );
  await db.users.upsertRole(deployer.address, "admin");

  // Create Class Sessions if totalSessions < 5
  const currentTotal = Number(await contract.totalSessions());
  console.log(`\nCurrent total sessions on-chain: ${currentTotal}`);

  if (currentTotal < SESSIONS.length) {
    console.log(`Creating ${SESSIONS.length - currentTotal} new academic sessions...`);
    for (let i = currentTotal; i < SESSIONS.length; i++) {
      const subject = SESSIONS[i];
      console.log(`Creating Session #${i + 1}: ${subject}`);
      const tx = await contract.connect(teacher).createSession(subject);
      const rc = await tx.wait();
      await db.sessions.upsert(i, subject, teacher.address, rc.hash, new Date(Date.now() - (SESSIONS.length - i) * 86400000));
    }
  }

  const updatedTotal = Number(await contract.totalSessions());
  console.log(`Sessions count is now: ${updatedTotal}`);

  // Mark realistic attendance for all sessions
  console.log("\n📝 Marking on-chain attendance for class sessions...");
  for (let sessId = 0; sessId < updatedTotal; sessId++) {
    const presentList = [];
    for (const s of studentsWithWallets) {
      // Determine if student attended this session based on their target attendedCount
      // e.g. If attendedCount is 5, they attend sessions 0,1,2,3,4
      // If attendedCount is 4, they attend sessions 0,1,2,3
      // If attendedCount is 3, they attend sessions 0,1,2
      if (sessId < s.attendedCount) {
        const hasAttended = await contract.hasAttended(sessId, s.walletAddress);
        if (!hasAttended) {
          presentList.push(s.walletAddress);
        }
      }
    }

    if (presentList.length > 0) {
      console.log(`Session #${sessId + 1}: Batch marking ${presentList.length} students on-chain...`);
      const tx = await contract.connect(teacher).markAttendanceBatch(sessId, presentList);
      const rc = await tx.wait();
      for (const stAddr of presentList) {
        await db.attendance.upsert(sessId, stAddr, "present", rc.hash, new Date(Date.now() - (updatedTotal - sessId) * 86400000));
      }
      console.log(`✓ Session #${sessId + 1} marked! Tx: ${rc.hash.slice(0, 16)}...`);
    } else {
      console.log(`Session #${sessId + 1} already has all target attendance marked.`);
    }
  }

  // Display summary of top students and their attendance status
  console.log("\n📊 Student Attendance Summary (Sample of Class Batch):");
  console.table(
    studentsWithWallets.slice(0, 10).map((s) => ({
      "Roll No": s.rollNo,
      "Name": s.name,
      "Attended": `${s.attendedCount} / ${updatedTotal}`,
      "Percentage": `${Math.round((s.attendedCount * 100) / updatedTotal)}%`,
      "Eligible for 0.01 ETH": s.attendedCount * 100 / updatedTotal >= 75 ? "✅ YES" : "⏳ Need More",
    }))
  );

  console.log("\n🎉 Database & Blockchain Seeding Complete!");
  console.log("38 students, 5 sessions, and batch attendance records are now live on localhost!");
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

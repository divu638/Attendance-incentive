const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Attendance-Linked Incentive Program (Smart Contract Test Suite)", function () {
  let c, admin, teacher, s1, s2, outsider;
  const REWARD = ethers.parseEther("0.1");

  beforeEach(async () => {
    [admin, teacher, s1, s2, outsider] = await ethers.getSigners();
    const F = await ethers.getContractFactory("AttendanceIncentive");
    c = await F.deploy(75, REWARD);
    await c.addTeacher(teacher.address);
    await c.connect(teacher).registerStudent(s1.address);
    await c.connect(teacher).registerStudent(s2.address);
    await admin.sendTransaction({ to: await c.getAddress(), value: ethers.parseEther("1") });

    // Conduct 4 sessions
    for (let i = 0; i < 4; i++) {
      await c.connect(teacher).createSession("Blockchain & Smart Contracts");
    }
  });

  const mark = (id, st) => c.connect(teacher).markAttendance(id, st.address);

  describe("Module 1: Role-Based Access Control & Registration", function () {
    it("1. Non-teacher cannot mark attendance", async () => {
      await expect(c.connect(outsider).markAttendance(0, s1.address))
        .to.be.revertedWithCustomError(c, "NotTeacher");
    });

    it("2. Non-admin cannot add or remove teachers", async () => {
      await expect(c.connect(outsider).addTeacher(outsider.address))
        .to.be.revertedWithCustomError(c, "NotAdmin");
      await expect(c.connect(outsider).removeTeacher(teacher.address))
        .to.be.revertedWithCustomError(c, "NotAdmin");
    });

    it("3. Unregistered student cannot be marked", async () => {
      await expect(mark(0, outsider))
        .to.be.revertedWithCustomError(c, "StudentNotRegistered");
    });

    it("4. Student cannot be registered twice or with zero address", async () => {
      await expect(c.connect(teacher).registerStudent(s1.address))
        .to.be.revertedWithCustomError(c, "StudentAlreadyRegistered");
      await expect(c.connect(teacher).registerStudent(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(c, "ZeroAddressNotAllowed");
    });
  });

  describe("Module 2: Attendance Tracking & Sessions", function () {
    it("5. Same student cannot be marked twice for one session", async () => {
      await mark(0, s1);
      await expect(mark(0, s1))
        .to.be.revertedWithCustomError(c, "AttendanceAlreadyMarked");
    });

    it("6. Batch marking records attendance for multiple students efficiently", async () => {
      await c.connect(teacher).markAttendanceBatch(0, [s1.address, s2.address]);
      expect(await c.attendedCount(s1.address)).to.equal(1n);
      expect(await c.attendedCount(s2.address)).to.equal(1n);
      expect(await c.hasAttended(0, s1.address)).to.be.true;
      expect(await c.hasAttended(0, s2.address)).to.be.true;
    });

    it("7. Creating session requires non-empty subject", async () => {
      await expect(c.connect(teacher).createSession(""))
        .to.be.revertedWithCustomError(c, "SubjectEmpty");
    });
  });

  describe("Module 3: Incentive Claiming & Thresholds", function () {
    it("8. Claim below required percent reverts", async () => {
      await mark(0, s1);
      await mark(1, s1); // 2 out of 4 sessions = 50%
      expect(await c.attendancePercent(s1.address)).to.equal(50n);
      expect(await c.isEligible(s1.address)).to.be.false;

      await expect(c.connect(s1).claimReward())
        .to.be.revertedWithCustomError(c, "AttendanceBelowThreshold");
    });

    it("9. Claim at or above required percent releases ETH reward and emits event", async () => {
      await mark(0, s1);
      await mark(1, s1);
      await mark(2, s1); // 3 out of 4 sessions = 75%
      expect(await c.attendancePercent(s1.address)).to.equal(75n);
      expect(await c.isEligible(s1.address)).to.be.true;

      await expect(c.connect(s1).claimReward())
        .to.emit(c, "RewardClaimed")
        .withArgs(s1.address, 75n, REWARD, (val) => val > 0);

      expect(await c.rewardClaimed(s1.address)).to.be.true;
      expect(await c.isEligible(s1.address)).to.be.false;
    });

    it("10. Exact reward amount transfers from contract to student wallet", async () => {
      for (let i = 0; i < 3; i++) await mark(i, s1);
      await expect(c.connect(s1).claimReward())
        .to.changeEtherBalances([s1, c], [REWARD, -REWARD]);
    });

    it("11. Double claiming reward reverts (reentrancy and replay prevention)", async () => {
      for (let i = 0; i < 3; i++) await mark(i, s1);
      await c.connect(s1).claimReward();
      await expect(c.connect(s1).claimReward())
        .to.be.revertedWithCustomError(c, "RewardAlreadyClaimed");
    });

    it("12. Claim with low contract pool balance reverts", async () => {
      const F = await ethers.getContractFactory("AttendanceIncentive");
      const emptyPoolContract = await F.deploy(50, REWARD);
      await emptyPoolContract.addTeacher(teacher.address);
      await emptyPoolContract.connect(teacher).registerStudent(s1.address);
      await emptyPoolContract.connect(teacher).createSession("Cryptography");
      await emptyPoolContract.connect(teacher).markAttendance(0, s1.address);

      await expect(emptyPoolContract.connect(s1).claimReward())
        .to.be.revertedWithCustomError(emptyPoolContract, "InsufficientContractPool");
    });
  });

  describe("Module 4: Security (Circuit Breaker Pausable) & Administration", function () {
    it("13. Admin can pause and unpause contract interactions", async () => {
      await c.pause();
      expect(await c.paused()).to.be.true;

      // When paused, operations should revert
      await expect(c.connect(teacher).createSession("New Session"))
        .to.be.revertedWithCustomError(c, "EnforcedPause");

      await c.unpause();
      expect(await c.paused()).to.be.false;
      await expect(c.connect(teacher).createSession("New Session"))
        .to.emit(c, "SessionCreated");
    });

    it("14. Admin can update rules dynamically", async () => {
      await expect(c.setRules(80, ethers.parseEther("0.2")))
        .to.emit(c, "RulesUpdated")
        .withArgs(80, ethers.parseEther("0.2"));

      expect(await c.requiredPercent()).to.equal(80n);
      expect(await c.rewardAmount()).to.equal(ethers.parseEther("0.2"));
    });

    it("15. Analytics helpers return accurate metrics for viva evaluation", async () => {
      await mark(0, s1);
      const summary = await c.getStudentSummary(s1.address);
      expect(summary.registered).to.be.true;
      expect(summary.attended).to.equal(1n);
      expect(summary.total).to.equal(4n);
      expect(summary.percent).to.equal(25n);

      const metrics = await c.getSystemMetrics();
      expect(metrics._totalSessions).to.equal(4n);
      expect(metrics._totalStudents).to.equal(2n);
      expect(metrics._requiredPercent).to.equal(75n);
    });
  });
});

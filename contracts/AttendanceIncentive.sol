// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AttendanceIncentive
 * @author Blockchain Academic Project
 * @notice A decentralized attendance tracking and automated incentive distribution system.
 * @dev Records student attendance on the Ethereum blockchain, enforces immutability,
 *      and programmatically releases crypto rewards (ETH) when attendance thresholds are met.
 */
contract AttendanceIncentive is ReentrancyGuard, Pausable {

    // =========================================================================
    //                               CUSTOM ERRORS
    // =========================================================================
    error NotAdmin();
    error NotTeacher();
    error ZeroAddressNotAllowed();
    error StudentAlreadyRegistered();
    error StudentNotRegistered();
    error InvalidSessionId();
    error AttendanceAlreadyMarked();
    error SubjectEmpty();
    error InvalidPercentRange();
    error AttendanceBelowThreshold(uint256 currentPercent, uint256 requiredPercent);
    error RewardAlreadyClaimed();
    error InsufficientContractPool(uint256 requiredAmount, uint256 availableBalance);
    error FundTransferFailed();
    error ZeroEtherSent();

    // =========================================================================
    //                            STATE VARIABLES
    // =========================================================================
    /// @notice The contract deployer and administrator (e.g., Dean / Department Head)
    address public admin;

    /// @notice The attendance threshold (e.g., 75 represents 75%)
    uint256 public requiredPercent;

    /// @notice Reward amount in Wei disbursed per eligible student (e.g., 0.01 ETH)
    uint256 public rewardAmount;

    /// @notice Total number of academic sessions conducted so far
    uint256 public totalSessions;

    /// @notice Total unique students registered
    uint256 public totalStudents;

    /// @notice Total rewards claimed by students in Wei
    uint256 public totalRewardsDisbursed;

    /// @dev Structure representing a single class session
    struct Session {
        string subject;
        uint256 timestamp;
        address createdBy;
    }

    /// @dev Role mappings
    mapping(address => bool) public isTeacher;
    mapping(address => bool) public isStudent;

    /// @dev Attendance state mappings
    mapping(address => uint256) public attendedCount;
    mapping(address => bool) public rewardClaimed;
    mapping(uint256 => Session) public sessions;
    // session ID => student address => marked present (true/false)
    mapping(uint256 => mapping(address => bool)) public attendance;

    // =========================================================================
    //                                EVENTS
    // =========================================================================
    event TeacherAdded(address indexed teacher);
    event TeacherRemoved(address indexed teacher);
    event RulesUpdated(uint256 requiredPercent, uint256 rewardAmount);
    event StudentRegistered(address indexed student, address indexed by);
    event SessionCreated(uint256 indexed sessionId, string subject, address indexed by, uint256 timestamp);
    event AttendanceMarked(uint256 indexed sessionId, address indexed student, address indexed by, uint256 timestamp);
    event RewardClaimed(address indexed student, uint256 percent, uint256 amount, uint256 timestamp);
    event Funded(address indexed from, uint256 amount);
    event EmergencyFundsWithdrawn(address indexed to, uint256 amount);

    // =========================================================================
    //                              MODIFIERS
    // =========================================================================
    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyTeacher() {
        if (!isTeacher[msg.sender]) revert NotTeacher();
        _;
    }

    // =========================================================================
    //                            CONSTRUCTOR
    // =========================================================================
    /**
     * @notice Initializes the smart contract with attendance parameters.
     * @param _requiredPercent The minimum percentage required for an incentive (1 - 100).
     * @param _rewardAmount The reward amount in Wei per eligible student.
     */
    constructor(uint256 _requiredPercent, uint256 _rewardAmount) {
        if (_requiredPercent == 0 || _requiredPercent > 100) revert InvalidPercentRange();

        admin = msg.sender;
        requiredPercent = _requiredPercent;
        rewardAmount = _rewardAmount;

        emit RulesUpdated(_requiredPercent, _rewardAmount);
    }

    // =========================================================================
    //                          ADMINISTRATIVE FUNCTIONS
    // =========================================================================
    /**
     * @notice Grants faculty/teacher privileges to an address.
     * @param teacher The wallet address of the teacher.
     */
    function addTeacher(address teacher) external onlyAdmin {
        if (teacher == address(0)) revert ZeroAddressNotAllowed();
        isTeacher[teacher] = true;
        emit TeacherAdded(teacher);
    }

    /**
     * @notice Revokes faculty/teacher privileges from an address.
     * @param teacher The wallet address of the teacher.
     */
    function removeTeacher(address teacher) external onlyAdmin {
        isTeacher[teacher] = false;
        emit TeacherRemoved(teacher);
    }

    /**
     * @notice Updates the required attendance percentage and the reward payout.
     * @param _requiredPercent New attendance threshold (1 - 100).
     * @param _rewardAmount New reward payout in Wei.
     */
    function setRules(uint256 _requiredPercent, uint256 _rewardAmount) external onlyAdmin {
        if (_requiredPercent == 0 || _requiredPercent > 100) revert InvalidPercentRange();
        requiredPercent = _requiredPercent;
        rewardAmount = _rewardAmount;
        emit RulesUpdated(_requiredPercent, _rewardAmount);
    }

    /**
     * @notice Pauses contract interactions in case of emergency (Circuit Breaker pattern).
     */
    function pause() external onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpauses contract interactions.
     */
    function unpause() external onlyAdmin {
        _unpause();
    }

    /**
     * @notice Allows admin to withdraw surplus funds from the reward pool.
     * @param amount The amount in Wei to withdraw.
     */
    function withdrawSurplus(uint256 amount) external onlyAdmin nonReentrant {
        if (amount > address(this).balance) revert InsufficientContractPool(amount, address(this).balance);
        (bool ok, ) = payable(admin).call{value: amount}("");
        if (!ok) revert FundTransferFailed();
        emit EmergencyFundsWithdrawn(admin, amount);
    }

    // =========================================================================
    //                            TEACHER FUNCTIONS
    // =========================================================================
    /**
     * @notice Registers a new student on the blockchain.
     * @param student The wallet address of the student.
     */
    function registerStudent(address student) external onlyTeacher whenNotPaused {
        if (student == address(0)) revert ZeroAddressNotAllowed();
        if (isStudent[student]) revert StudentAlreadyRegistered();

        isStudent[student] = true;
        totalStudents += 1;
        emit StudentRegistered(student, msg.sender);
    }

    /**
     * @notice Creates a new classroom session on-chain.
     * @param subject The name or topic of the class session.
     * @return sessionId The unique identifier for the created session.
     */
    function createSession(string calldata subject) external onlyTeacher whenNotPaused returns (uint256 sessionId) {
        if (bytes(subject).length == 0) revert SubjectEmpty();

        sessionId = totalSessions;
        sessions[sessionId] = Session({
            subject: subject,
            timestamp: block.timestamp,
            createdBy: msg.sender
        });
        totalSessions += 1;

        emit SessionCreated(sessionId, subject, msg.sender, block.timestamp);
    }

    /**
     * @notice Marks attendance for a single student in a specific session.
     * @param sessionId The ID of the session.
     * @param student The wallet address of the student.
     */
    function markAttendance(uint256 sessionId, address student) external onlyTeacher whenNotPaused {
        if (sessionId >= totalSessions) revert InvalidSessionId();
        if (!isStudent[student]) revert StudentNotRegistered();
        if (attendance[sessionId][student]) revert AttendanceAlreadyMarked();

        attendance[sessionId][student] = true;
        attendedCount[student] += 1;

        emit AttendanceMarked(sessionId, student, msg.sender, block.timestamp);
    }

    /**
     * @notice Batch marks attendance for multiple students in one transaction (Gas Optimization).
     * @param sessionId The ID of the session.
     * @param students An array of student wallet addresses.
     */
    function markAttendanceBatch(uint256 sessionId, address[] calldata students) external onlyTeacher whenNotPaused {
        if (sessionId >= totalSessions) revert InvalidSessionId();

        uint256 len = students.length;
        for (uint256 i = 0; i < len; ) {
            address s = students[i];
            if (!isStudent[s]) revert StudentNotRegistered();
            if (attendance[sessionId][s]) revert AttendanceAlreadyMarked();

            attendance[sessionId][s] = true;
            attendedCount[s] += 1;

            emit AttendanceMarked(sessionId, s, msg.sender, block.timestamp);
            unchecked { ++i; } // Gas optimization
        }
    }

    // =========================================================================
    //                            STUDENT FUNCTIONS
    // =========================================================================
    /**
     * @notice Calculates the attendance percentage of a student.
     * @param student The wallet address of the student.
     * @return The percentage of sessions attended (0 - 100).
     */
    function attendancePercent(address student) public view returns (uint256) {
        if (totalSessions == 0) return 0;
        return (attendedCount[student] * 100) / totalSessions;
    }

    /**
     * @notice Checks whether a student is eligible to claim the attendance incentive.
     * @param student The wallet address of the student.
     * @return True if student is registered, hasn't claimed yet, and meets or exceeds the required percent.
     */
    function isEligible(address student) public view returns (bool) {
        return isStudent[student] &&
               !rewardClaimed[student] &&
               totalSessions > 0 &&
               attendancePercent(student) >= requiredPercent;
    }

    /**
     * @notice Releases the ETH reward directly to the calling student if criteria are met.
     * @dev Implements Checks-Effects-Interactions pattern alongside ReentrancyGuard.
     */
    function claimReward() external nonReentrant whenNotPaused {
        if (!isStudent[msg.sender]) revert StudentNotRegistered();
        if (rewardClaimed[msg.sender]) revert RewardAlreadyClaimed();

        uint256 percent = attendancePercent(msg.sender);
        if (percent < requiredPercent) revert AttendanceBelowThreshold(percent, requiredPercent);

        uint256 amount = rewardAmount;
        if (address(this).balance < amount) {
            revert InsufficientContractPool(amount, address(this).balance);
        }

        // State update BEFORE external ether transfer (Checks-Effects-Interactions)
        rewardClaimed[msg.sender] = true;
        totalRewardsDisbursed += amount;

        // External fund transfer
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert FundTransferFailed();

        emit RewardClaimed(msg.sender, percent, amount, block.timestamp);
    }

    // =========================================================================
    //                        ANALYTICS & VIEW HELPERS
    // =========================================================================
    /**
     * @notice Retrieves full summary stats for a student in a single RPC call.
     * @param student The wallet address of the student.
     */
    function getStudentSummary(address student) external view returns (
        bool registered,
        uint256 attended,
        uint256 total,
        uint256 percent,
        bool eligible,
        bool claimed
    ) {
        registered = isStudent[student];
        attended = attendedCount[student];
        total = totalSessions;
        percent = attendancePercent(student);
        eligible = isEligible(student);
        claimed = rewardClaimed[student];
    }

    /**
     * @notice Helper to check attendance status for a student in a specific session.
     */
    function hasAttended(uint256 sessionId, address student) external view returns (bool) {
        return attendance[sessionId][student];
    }

    /**
     * @notice Retrieves system-level metrics for dashboard and examiner demonstration.
     */
    function getSystemMetrics() external view returns (
        uint256 _totalSessions,
        uint256 _totalStudents,
        uint256 _poolBalance,
        uint256 _totalRewardsDisbursed,
        uint256 _requiredPercent,
        uint256 _rewardAmount,
        bool _isPaused
    ) {
        return (
            totalSessions,
            totalStudents,
            address(this).balance,
            totalRewardsDisbursed,
            requiredPercent,
            rewardAmount,
            paused()
        );
    }

    // =========================================================================
    //                           FUNDING & RECEIVE
    // =========================================================================
    /**
     * @notice Explicit function to deposit funds into the incentive reward pool.
     */
    function fund() external payable {
        if (msg.value == 0) revert ZeroEtherSent();
        emit Funded(msg.sender, msg.value);
    }

    /**
     * @notice Direct ETH transfer fallback handler.
     */
    receive() external payable {
        emit Funded(msg.sender, msg.value);
    }
}

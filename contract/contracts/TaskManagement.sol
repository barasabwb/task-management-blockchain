// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TaskManagement {
    // structures and enums
    // Task statuses
    enum TaskStatus { UNALLOCATED, INPROGRESS, PENDING_APPROVAL, COMPLETE, CANCELLED }
    // Task structure
    struct Task {
        uint256 id;
        string name;
        string description;
        uint256 timestamp;
        uint256 expiry;
        TaskStatus status;
        address payable assignedTo;
        address payable creator;
        uint256 reward;
    }

    // Mappings and state variables
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;

    // for iteration
    uint256[] public taskIds;
    uint256 public numTasks;

    // Events
    event TaskCreated(uint256 taskId, string name, uint256 expiry, address creator);
    event TaskAssigned(uint256 taskId, address assignedTo);
    event TaskCancelled(uint256 taskId);
    event TaskCompleted(uint256 taskId);
    event TaskApproved(uint256 taskId);


    //modifiers
    modifier onlyCreator(uint256 taskId) {
        require(msg.sender == tasks[taskId].creator, "Not task creator");
        _;
    }

    modifier notExpired(uint256 taskId) {
        require(block.timestamp <= tasks[taskId].expiry, "Task expired  ");
        _;
    }

    // Create task and fund reward
    function addTask(
        string memory name,
        string memory description,
        uint256 expiry
    ) external payable {
        require(msg.value > 0, "Reward must be > 0");

        uint256 taskId = numTasks++;
        tasks[taskId] = Task({
            id: taskId,
            name: name,
            description: description,
            timestamp: block.timestamp,
            expiry: expiry,
            status: TaskStatus.UNALLOCATED,
            assignedTo: payable(address(0)),
            creator: payable(msg.sender),
            reward: msg.value
        });

        taskIds.push(taskId);
        emit TaskCreated(taskId, name, expiry, msg.sender);
        console.log("New Task Added:", taskId, name, msg.sender);
    }

    // Take a task
    function takeTask(uint256 taskId) external notExpired(taskId) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.UNALLOCATED, "Not unallocated");
        require(task.creator != msg.sender, "Creator cannot take own task");

        task.assignedTo = payable(msg.sender);
        task.status = TaskStatus.INPROGRESS;
        userTasks[msg.sender].push(taskId);

        emit TaskAssigned(taskId, msg.sender);
        console.log("Task assigned:", taskId, uint160(msg.sender));
    }

    // Cancel task before taken
    function cancelTask(uint256 taskId) external onlyCreator(taskId) {
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.UNALLOCATED, "Task already allocated");

        task.status = TaskStatus.CANCELLED;

        // refund
        (bool sent, ) = task.creator.call{value: task.reward}("");
        require(sent, "Refund failed");

        emit TaskCancelled(taskId);
        console.log("Task cancelled:", taskId, "Reward refunded:", task.reward);
    }

    

    // Complete task - needs approval to get reward
    function completeTask(uint256 taskId) external notExpired(taskId) {
        Task storage task = tasks[taskId];
        require(task.assignedTo == msg.sender, "You are not assigned to this task");
        require(task.status == TaskStatus.INPROGRESS, "Task not in progress");

        task.status = TaskStatus.PENDING_APPROVAL;

        emit TaskCompleted(taskId);
        console.log("Task completed:", taskId, "By:", task.assignedTo);
    }

    // Approve task completion
    function approveTask(uint256 taskId) external {
        Task storage task = tasks[taskId];
        require(task.creator == msg.sender, "You are not the creator");
        require(task.status == TaskStatus.PENDING_APPROVAL, "The task is not pending approval");

        task.status = TaskStatus.COMPLETE;

        // Safe payment
        (bool sent, ) = task.assignedTo.call{value: task.reward}("");
        require(sent, "Reward payment failed");

        emit TaskApproved(taskId);
        console.log("Task approved:", taskId, "To:", task.assignedTo);
        console.log( "Reward:", task.reward);
    }

    // get all tasks
    function getAllTasks() external view returns (Task[] memory) {
        Task[] memory all = new Task[](taskIds.length);
        for (uint256 i = 0; i < taskIds.length; i++) {
            all[i] = tasks[taskIds[i]];
        }
        return all;
    }

    // get tasks assigned to a user    
    function getUserTasks(address user) external view returns (Task[] memory) {
        uint256[] memory ids = userTasks[user];
        Task[] memory result = new Task[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = tasks[ids[i]];
        }
        return result;
    }
}

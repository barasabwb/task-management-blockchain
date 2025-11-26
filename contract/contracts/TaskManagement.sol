// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract TaskManagement {
    // enum for task statuses
    enum TaskStatus { UNALLOCATED, INPROGRESS, COMPLETE, CANCELLED }

    // task structures
    struct Task {
        uint256 id;
        string name;
        string description;
        uint256 timestamp;
        uint256 expiry;
        TaskStatus status;
        address assignedTo;
        address creator;   
    }

    // data stores for tasks and tracking user tasks 
    mapping(uint256 => Task) public tasks;
    mapping(address => uint256[]) public userTasks;

    // for easy iteration
    uint256[] public taskIds;

    uint256 public numTasks;

    // events for task actions
    event TaskCreated(uint256 taskId, string name, uint256 expiry, address creator);
    event TaskAssigned(uint256 taskId, address assignedTo);
    event TaskCancelled(uint256 taskId);
    event TaskCompleted(uint256 taskId);

    // modifier to only allow creator access to actions 
    modifier onlyCreator(uint256 taskId) {
        require(tasks[taskId].creator == msg.sender, "Not task creator");
        _;
    }
    // function to add a new task
    function addTask(
        string memory name,
        string memory description,
        uint256 expiry
    ) external {
        uint256 taskId = numTasks++;

        tasks[taskId] = Task({
            id: taskId,
            name: name,
            description: description,
            timestamp: block.timestamp,
            expiry: expiry,
            status: TaskStatus.UNALLOCATED,
            assignedTo: address(0),
            creator: msg.sender      
        });

        taskIds.push(taskId);
        emit TaskCreated(taskId, name, expiry, msg.sender);
        console.log("New Task Added: ", taskId, name, msg.sender);
    }

    // Only creator can allocate tasks
    function takeTask(uint256 taskId) external returns (bool) {
        Task storage task = tasks[taskId];

        require(task.status == TaskStatus.UNALLOCATED, "Not unallocated");
        require(task.creator != msg.sender, "Creator cannot take own task");

        task.assignedTo = msg.sender;
        task.status = TaskStatus.INPROGRESS;
        userTasks[msg.sender].push(taskId);

        emit TaskAssigned(taskId, msg.sender);  // reuse event
        console.log("Task assigned: ", taskId);
        return true;
    }


    // Only creator can cancel before assignment
    function cancelTask(uint256 taskId)
        external
        onlyCreator(taskId)
        returns (bool)
    {
        
        Task storage task = tasks[taskId];
        require(task.status == TaskStatus.UNALLOCATED, "Task already allocated");
        
        if (task.status == TaskStatus.UNALLOCATED) {
            task.status = TaskStatus.CANCELLED;

            emit TaskCancelled(taskId);
            console.log("Task cancelled: ", taskId);
            return true;
        }
        return false;
    }

    // Only assigned user can complete the task
    function completeTask(uint256 taskId) external returns (bool) {
        Task storage task = tasks[taskId];
        if (task.assignedTo == msg.sender && task.status == TaskStatus.INPROGRESS) {
            task.status = TaskStatus.COMPLETE;

            emit TaskCompleted(taskId);
            console.log("Task completed: ", taskId, task.assignedTo);
            return true;
        }
        return false;
    }

    //get all tasks on the blockchain
    function getAllTasks() external view returns (Task[] memory) {
        uint256 total = taskIds.length;
        Task[] memory all = new Task[](total);

        for (uint256 i = 0; i < total; i++) {
            all[i] = tasks[taskIds[i]];
        }
        console.log("Tasks Retrieved: ", total);
        return all;
    }

    //get tasks assigned to a specific user
    function getUserTasks(address user) external view returns (Task[] memory) {
        uint256[] memory ids = userTasks[user];
        Task[] memory result = new Task[](ids.length);

        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = tasks[ids[i]];
        }
        console.log("Tasks Retrieved: ", ids.length);
        return result;
    }
}

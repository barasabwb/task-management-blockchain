const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskManagement Contract", function () {
  let TaskManagement, taskContract, owner, user1, user2;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    TaskManagement = await ethers.getContractFactory("TaskManagement");
    taskContract = await TaskManagement.deploy();
    await taskContract.waitForDeployment();
  });

  it("Should deploy correctly", async () => {
    expect(await taskContract.numTasks()).to.equal(0);
  });

  it("Should allow creating a new task with ETH reward", async () => {
    const expiry = 9999999999;
    const reward = ethers.parseEther("0.01");

    await expect(
      taskContract.connect(owner).addTask("Test Task", "Desc", expiry, { value: reward })
    ).to.emit(taskContract, "TaskCreated")
     .withArgs(0, "Test Task", expiry, owner.address);

    const task = await taskContract.tasks(0);
    expect(task.name).to.equal("Test Task");
    expect(task.creator).to.equal(owner.address);
    expect(task.reward).to.equal(reward);
  });

  it("Should allow non-creator to take a task", async () => {
    const reward = ethers.parseEther("0.01");
    await taskContract.connect(owner).addTask("Takeable Task", "Desc", 999999, { value: reward });

    await expect(taskContract.connect(user1).takeTask(0))
      .to.emit(taskContract, "TaskAssigned")
      .withArgs(0, user1.address);

    const task = await taskContract.tasks(0);
    expect(task.assignedTo).to.equal(user1.address);
    expect(task.status).to.equal(1); // INPROGRESS
  });

  it("Should NOT allow creator to take their own task", async () => {
    const reward = ethers.parseEther("0.01");
    await taskContract.connect(owner).addTask("Self Task", "Desc", 12345, { value: reward });

    await expect(taskContract.takeTask(0)).to.be.revertedWith("Creator cannot take own task");
  });



  it("Should NOT allow cancel after task is taken", async () => {
    const reward = ethers.parseEther("0.01");
    await taskContract.connect(owner).addTask("Cancelable", "Desc", 12345, { value: reward });
    await taskContract.connect(user1).takeTask(0);

    await expect(taskContract.cancelTask(0)).to.be.revertedWith("Task already allocated");
  });


  it("Should return all tasks", async () => {
    const reward = ethers.parseEther("0.01");
    await taskContract.connect(owner).addTask("Task 1", "Desc 1", 100, { value: reward });
    await taskContract.connect(owner).addTask("Task 2", "Desc 2", 200, { value: reward });

    const tasks = await taskContract.getAllTasks();
    expect(tasks.length).to.equal(2);
  });

  it("Should return tasks assigned to a user", async () => {
    const reward = ethers.parseEther("0.01");
    await taskContract.connect(owner).addTask("U Task 1", "Desc", 100, { value: reward });
    await taskContract.connect(owner).addTask("U Task 2", "Desc", 100, { value: reward });

    await taskContract.connect(user1).takeTask(0);
    await taskContract.connect(user1).takeTask(1);

    const result = await taskContract.getUserTasks(user1.address);
    expect(result.length).to.equal(2);
  });
});

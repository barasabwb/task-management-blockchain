const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TaskManagementModule", (m) => {
  const taskmanagement = m.contract("TaskManagement");
  return { taskmanagement };
});

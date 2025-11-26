import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import contractABI from "./contracts/TaskManagement.json";
import "./App.css";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ---------------------------------------------------------
//  COMPONENTS MOVED OUTSIDE APP SO THEY STOP REMOUNTING
// ---------------------------------------------------------

const Topbar = React.memo(function Topbar({
  account,
  connectWallet,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="w-full flex items-center justify-between bg-base-200 px-4 py-3 rounded-md mb-4 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">TaskManager Dashboard</h1>
        <span className="text-sm text-muted">Manage tasks on-chain</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:block">
          <input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-sm input-bordered"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            className="select select-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="0">Unallocated</option>
            <option value="1">In progress</option>
            <option value="2">Complete</option>
            <option value="3">Cancelled</option>
          </select>

          {!account ? (
            <button className="btn btn-sm btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-sm">{account.slice(0, 6)}...{account.slice(-4)}</div>
              <div className="badge badge-outline">Connected</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const QuickAddForm = React.memo(function QuickAddForm({ onAddTask, loading }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const handleAdd = async () => {
    await onAddTask(name, desc);
    setName("");
    setDesc("");
  };

  return (
    <div>
      <div className="text-sm text-muted mb-2">Quick add</div>

      <input
        className="input input-sm input-bordered mb-2"
        placeholder="title"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="input input-sm input-bordered mb-2"
        placeholder="description"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />

      <button
        className="btn btn-sm btn-success w-full"
        onClick={handleAdd}
        disabled={loading || !name}
      >
        Add
      </button>
    </div>
  );
});

const Sidebar = React.memo(function Sidebar({
  activeView,
  setActiveView,
  addTask,
  loading,
}) {
  return (
    <div className="w-64 bg-base-100 rounded-md p-3 shadow">
      <div className="mb-4">
        <div className="text-lg font-bold">Navigation</div>
        <div className="text-sm text-muted">Quick actions</div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => setActiveView("all")}
          className={`btn btn-ghost justify-start ${
            activeView === "all" ? "bg-base-200" : ""
          }`}
        >
          All Tasks
        </button>

        <button
          onClick={() => setActiveView("mine")}
          className={`btn btn-ghost justify-start ${
            activeView === "mine" ? "bg-base-200" : ""
          }`}
        >
          My Tasks
        </button>

        <button
          onClick={() => setActiveView("created")}
          className={`btn btn-ghost justify-start ${
            activeView === "created" ? "bg-base-200" : ""
          }`}
        >
          Tasks I Created
        </button>

        <div className="divider" />

        <QuickAddForm onAddTask={addTask} loading={loading} />
      </div>
    </div>
  );
});

const TaskTable = React.memo(function TaskTable({
  list,
  applyFilters,
  
  takeTask,
  completeTask,
  cancelTask,
  account,
  loading,
  statusLabels,
  statusColors,
  isExpired,
  formatDate,
}) {
  const items = applyFilters(list);

  return (
    <div className="overflow-x-auto bg-base-100 rounded-md p-3 shadow">
      <table className="table w-full">
        <thead>
          <tr>
            <th>ID</th>
            <th>Task</th>
            <th>Status</th>
            <th>Creator</th>
            <th>Assignee</th>
            <th>Deadline</th>
            <th className="text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan="7" className="text-center py-8 text-muted">
                No tasks found
              </td>
            </tr>
          )}

          {items.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>

              <td className="max-w-xs">
                <div className="font-semibold">{t.name}</div>
                <div className="text-xs text-muted truncate">{t.description}</div>
              </td>

              <td>
                <div className={statusColors[t.status]}>
                  {statusLabels[t.status]}
                </div>
              </td>

              <td className="text-xs">
                {t.creator
                  ? `${t.creator.slice(0, 6)}...${t.creator.slice(-4)}`
                  : "-"}
              </td>

              <td className="text-xs">
                {t.assignedTo === ethers.ZeroAddress
                  ? "-"
                  : `${t.assignedTo.slice(0, 6)}...${t.assignedTo.slice(-4)}`}
              </td>

              <td
                className={
                  isExpired(t.expiry)
                    ? "text-red-600 font-bold"
                    : "text-sm"
                }
              >
                {formatDate(t.expiry)}
                {isExpired(t.expiry) && (
                  <span className="text-xs"> • Expired</span>
                )}
              </td>

              <td className="text-right">
                <div className="flex justify-end gap-2">

                  {t.status === 0 && t.creator.toLowerCase() !== account.toLowerCase() && (
                    <button
                      className="btn btn-xs btn-info"
                      onClick={() => takeTask(t.id)}
                      disabled={loading}
                    >
                      Take Task
                    </button>
                  )}

                  {t.status === 0 &&
                    t.creator.toLowerCase() === account.toLowerCase() && (
                      <>
                

                        <button
                          className="btn btn-xs btn-warning"
                          onClick={() => cancelTask(t.id)}
                          disabled={loading}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                  {t.status === 1 &&
                    t.assignedTo.toLowerCase() === account.toLowerCase() && (
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => completeTask(t.id)}
                        disabled={loading}
                      >
                        Complete
                      </button>
                    )}

                  {!(t.status === 0 || t.status === 1) && (
                    <button className="btn btn-xs btn-ghost" disabled>
                      —
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ---------------------------------------------------------
//                       MAIN APP
// ---------------------------------------------------------

export default function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);

  const [allTasks, setAllTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [createdTasks, setCreatedTasks] = useState([]);

  const [activeView, setActiveView] = useState("all");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const statusLabels = ["UNALLOCATED", "INPROGRESS", "COMPLETE", "CANCELLED"];
  const statusColors = {
    0: "badge badge-ghost",
    1: "badge badge-warning",
    2: "badge badge-success",
    3: "badge badge-error",
  };

  const isExpired = (exp) => exp * 1000 < Date.now();
  const formatDate = (ts) => new Date(ts * 1000).toLocaleString();

  const normalizeTasks = (raw) =>
    raw.map((t) => ({
      id: Number(t.id),
      name: t.name,
      description: t.description,
      timestamp: Number(t.timestamp),
      expiry: Number(t.expiry),
      status: Number(t.status),
      assignedTo: String(t.assignedTo),
      creator: t.creator ? String(t.creator) : undefined,
    }));

  // ------------------ connect wallet ------------------
  const connectWallet = async () => {
    try {
      if (!window.ethereum) return toast.error("MetaMask not found");
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const c = new ethers.Contract(
        CONTRACT_ADDRESS,
        contractABI.abi,
        signer
      );

      setContract(c);
      setAccount(address);
      toast.success("Wallet connected");
    } catch (err) {
      console.error(err);
      toast.error("Wallet connect failed");
    }
  };

  // ------------------ load all tasks ------------------
  const loadAllTasks = useCallback(async () => {
    if (!contract) return;
    try {
      const raw = await contract.getAllTasks();
      setAllTasks(
        normalizeTasks(raw).sort((a, b) => b.timestamp - a.timestamp)
      );
    } catch (e) {
      toast.error("Failed to load tasks");
    }
  }, [contract]);

  const loadMyTasks = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const raw = await contract.getUserTasks(account);
      setMyTasks(
        normalizeTasks(raw).sort((a, b) => b.timestamp - a.timestamp)
      );
    } catch (e) {
      toast.error("Failed to load your tasks");
    }
  }, [contract, account]);

  const loadCreatedTasks = useCallback(async () => {
    if (!contract || !account) return;
    try {
      const raw = await contract.getAllTasks();
      const items = normalizeTasks(raw).filter(
        (t) => t.creator?.toLowerCase() === account.toLowerCase()
      );
      setCreatedTasks(items.sort((a, b) => b.timestamp - a.timestamp));
    } catch (e) {
      toast.error("Failed to load created tasks");
    }
  }, [contract, account]);

  // ------------------ actions ------------------
  const addTask = async (name, desc) => {
    if (!contract || !name) return;
    try {
      setLoading(true);
      const expiry = Math.floor(Date.now() / 1000) + 86400;
      const tx = await contract.addTask(name, desc, expiry);
      await tx.wait();

      toast.success("Task added");
      loadAllTasks();
      loadCreatedTasks();
    } catch (e) {
      toast.error("Add failed");
    } finally {
      setLoading(false);
    }
  };

  const assignTask = async (id) => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const tx = await contract.allocateTask(id, account);
      await tx.wait();
      toast.success("Task assigned");
      loadAllTasks();
      loadMyTasks();
    } catch (e) {
      toast.error("Assign failed");
    } finally {
      setLoading(false);
    }
  };

  const takeTask = async (id) => {
    if (!contract || !account) return;
    try {
      setLoading(true);
      const tx = await contract.takeTask(id);
      await tx.wait();

      toast.success("Task taken");
      loadAllTasks();
      loadMyTasks();
    } catch (e) {
      console.error(e);
      toast.error("Failed to take task");
    } finally {
      setLoading(false);
    }
};


  const completeTask = async (id) => {
    try {
      setLoading(true);
      const tx = await contract.completeTask(id);
      await tx.wait();
      toast.success("Task completed");
      loadAllTasks();
      loadMyTasks();
    } catch (e) {
      toast.error("Complete failed");
    } finally {
      setLoading(false);
    }
  };

  const cancelTask = async (id) => {
    try {
      setLoading(true);
      const tx = await contract.cancelTask(id);
      await tx.wait();
      toast.info("Task cancelled");
      loadAllTasks();
      loadCreatedTasks();
    } catch (e) {
      toast.error("Cancel failed");
    } finally {
      setLoading(false);
    }
  };

  // ------------------ event listeners ------------------
  useEffect(() => {
    if (!contract) return;

    loadAllTasks();
    if (account) {
      loadMyTasks();
      loadCreatedTasks();
    }

    const onCreated = () => {
      loadAllTasks();
      loadCreatedTasks();
    };
    const onAssigned = () => {
      loadAllTasks();
      loadMyTasks();
    };
    const onCompleted = () => {
      loadAllTasks();
      loadMyTasks();
    };

    contract.on("TaskCreated", onCreated);
    contract.on("TaskAssigned", onAssigned);
    contract.on("TaskCompleted", onCompleted);

    return () => {
      contract.removeAllListeners();
    };
  }, [contract, account]);

  // ------------------ filters ------------------
  const applyFilters = useCallback(
    (list) => {
      let out = [...list];
      if (statusFilter !== "all") {
        out = out.filter(
          (t) => Number(t.status) === Number(statusFilter)
        );
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        out = out.filter(
          (t) =>
            (t.name || "").toLowerCase().includes(q) ||
            (t.description || "").toLowerCase().includes(q)
        );
      }
      return out;
    },
    [search, statusFilter]
  );

  const activeList =
    activeView === "all"
      ? allTasks
      : activeView === "mine"
      ? myTasks
      : createdTasks;

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* TOPBAR (no more focus loss!) */}
        <Topbar
          account={account}
          connectWallet={connectWallet}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        <div className="grid grid-cols-12 gap-6">
          {/* SIDEBAR */}
          <div className="col-span-12 md:col-span-3">
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              addTask={addTask}
              loading={loading}
            />

            {/* Stats */}
            <div className="mt-4 space-y-3">
              <div className="card bg-base-100 shadow-sm p-4">
                <div className="text-sm text-muted">Total tasks</div>
                <div className="text-2xl font-bold">{allTasks.length}</div>
              </div>
              <div className="card bg-base-100 shadow-sm p-4">
                <div className="text-sm text-muted">My assigned</div>
                <div className="text-2xl font-bold">{myTasks.length}</div>
              </div>
              <div className="card bg-base-100 shadow-sm p-4">
                <div className="text-sm text-muted">Created</div>
                <div className="text-2xl font-bold">{createdTasks.length}</div>
              </div>
            </div>
          </div>

          {/* MAIN TABLE */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            <TaskTable
              list={activeList}
              applyFilters={applyFilters}
              assignTask={assignTask}
              takeTask={takeTask}
              completeTask={completeTask}
              cancelTask={cancelTask}
              account={account}
              loading={loading}
              statusLabels={statusLabels}
              statusColors={statusColors}
              isExpired={isExpired}
              formatDate={formatDate}
            />
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      </div>
    </div>
  );
}

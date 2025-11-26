import { useState } from "react";

export default function QuickAddTask({ onAdd, loading }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name, description);
    setName("");
    setDescription("");
  };

  return (
    <div className="bg-base-100 shadow p-4 rounded-xl space-y-3">

      <h2 className="font-semibold text-lg">Quick Add</h2>

      <input
        type="text"
        placeholder="Task name"
        className="input input-bordered w-full"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <textarea
        placeholder="Description"
        className="textarea textarea-bordered w-full"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <button
        className="btn btn-primary w-full"
        onClick={handleAdd}
        disabled={loading}
      >
        Add Task
      </button>

    </div>
  );
}

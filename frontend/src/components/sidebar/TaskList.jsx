//================================================================================
//FILE: C:\Users\prith\Desktop\TripIt\frontend\src\components\sidebar\TaskList.jsx
//================================================================================

import React, { useState } from 'react';
import { useTripStore } from '../../store/tripStore';
import { Plus, Trash2, Loader2 } from 'lucide-react';

const tasksSelector = (state) => state.selectedNodeTasks;

const TaskItem = ({ task, tripId, socket }) => {
  const handleToggle = () => {
    if (!socket) return;
    socket.emit('updateTask', {
      tripId,
      taskId: task._id,
      updates: { isCompleted: !task.isCompleted },
    });
  };

  const handleDelete = () => {
    if (!socket) return;
    socket.emit('deleteTask', {
      tripId,
      taskId: task._id,
    });
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-md hover:bg-background">
      <input
        type="checkbox"
        checked={task.isCompleted}
        onChange={handleToggle}
        className="form-checkbox h-4 w-4 text-accent bg-background border-border rounded"
      />
      <span
        className={`flex-1 text-sm ${
          task.isCompleted ? 'text-foreground-secondary line-through' : 'text-foreground'
        }`}
      >
        {task.text}
      </span>
      <button
        onClick={handleDelete}
        className="p-1 text-foreground-secondary hover:text-red-500 rounded-md"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
};

const TaskList = ({ tripId, nodeId, socket }) => {
  const tasks = useTripStore(tasksSelector);
  const [newTaskText, setNewTaskText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newTaskText.trim() || !socket) return;
    
    socket.emit('createTask', {
      tripId,
      nodeId,
      text: newTaskText.trim(),
    }, (createdTask) => {
      if (createdTask && !createdTask.error) {
        setNewTaskText('');
      }
    });
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskItem
              key={task._id}
              task={task}
              tripId={tripId}
              socket={socket}
            />
          ))
        ) : (
          <p className="text-sm text-foreground-secondary text-center py-4">
            No tasks for this node yet.
          </p>
        )}
      </div>
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 px-3 py-1.5 bg-background border border-border rounded-md placeholder-foreground-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          className="p-2 bg-accent text-white rounded-md hover:bg-accent-hover"
        >
          <Plus className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default TaskList;
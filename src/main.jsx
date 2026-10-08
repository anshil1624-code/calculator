import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle2, Circle, ClipboardList, LayoutDashboard, ListTodo, Plus, Search, Trash2, Pencil, X, Target } from 'lucide-react';
import './styles.css';

const starterTasks = [
  { id: 1, title: 'Complete React assignment', priority: 'High', dueDate: '2026-10-06', completed: false },
  { id: 2, title: 'Review JavaScript concepts', priority: 'Medium', dueDate: '2026-10-07', completed: true },
  { id: 3, title: 'Prepare presentation slides', priority: 'Low', dueDate: '2026-10-09', completed: false }
];

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('dailyTasks');
    return saved ? JSON.parse(saved) : starterTasks;
  });
  const [page, setPage] = useState('dashboard');
  const [editingTask, setEditingTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [toast, setToast] = useState('');

  useEffect(() => {
    localStorage.setItem('dailyTasks', JSON.stringify(tasks));
  }, [tasks]);

  const stats = useMemo(() => {
    const completed = tasks.filter(t => t.completed).length;
    return { total: tasks.length, completed, pending: tasks.length - completed, progress: tasks.length ? Math.round(completed / tasks.length * 100) : 0 };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || (filter === 'Completed' ? task.completed : !task.completed);
      return matchesSearch && matchesFilter;
    });
  }, [tasks, search, filter]);

  function saveTask(form) {
    const title = form.title.trim();
    if (!title) return showToast('Task title is required');
    if (!form.dueDate) return showToast('Please select a due date');

    if (editingTask) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...editingTask, ...form, title } : t));
      showToast('Task updated successfully');
      setEditingTask(null);
    } else {
      setTasks([...tasks, { id: Date.now(), ...form, title, completed: false }]);
      showToast('Task added successfully');
    }
  }

  function toggleTask(id) {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }

  function deleteTask(id) {
    setTasks(tasks.filter(t => t.id !== id));
    showToast('Task deleted');
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2200);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><ClipboardList size={22}/></div><div><strong>TaskFlow</strong><span>Daily Task Manager</span></div></div>
        <nav>
          <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}><LayoutDashboard size={19}/> Dashboard</button>
          <button className={page === 'tasks' ? 'active' : ''} onClick={() => setPage('tasks')}><ListTodo size={19}/> My Tasks</button>
          <button className={page === 'progress' ? 'active' : ''} onClick={() => setPage('progress')}><Target size={19}/> Progress</button>
        </nav>
        <div className="sidebar-tip"><strong>Stay productive ✨</strong><p>Small completed tasks create big progress.</p></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><p className="eyebrow">PERSONAL PRODUCTIVITY</p><h1>{page === 'dashboard' ? 'Good day! 👋' : page === 'tasks' ? 'My Tasks' : 'Your Progress'}</h1></div>
          <button className="primary-btn" onClick={() => { setEditingTask(null); setPage('tasks'); }}><Plus size={18}/> Add Task</button>
        </header>

        {page === 'dashboard' && <Dashboard stats={stats} tasks={tasks} onAdd={() => setPage('tasks')} onToggle={toggleTask} />}
        {page === 'tasks' && <TasksPage tasks={filteredTasks} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} onToggle={toggleTask} onDelete={deleteTask} onEdit={setEditingTask} onAdd={() => setEditingTask({ newTask: true })} />}
        {page === 'progress' && <Progress stats={stats} tasks={tasks} />}
      </main>

      {editingTask && <TaskModal task={editingTask.newTask ? null : editingTask} onClose={() => setEditingTask(null)} onSave={saveTask} />}
      {toast && <div className="toast">✓ {toast}</div>}
    </div>
  );
}

function Dashboard({ stats, tasks, onAdd, onToggle }) {
  return <section>
    <div className="stats-grid">
      <StatCard label="Total Tasks" value={stats.total} icon={<ListTodo/>}/>
      <StatCard label="Completed" value={stats.completed} icon={<CheckCircle2/>}/>
      <StatCard label="Pending" value={stats.pending} icon={<Circle/>}/>
      <StatCard label="Completion" value={`${stats.progress}%`} icon={<Target/>}/>
    </div>
    <div className="content-grid">
      <div className="panel">
        <div className="panel-head"><div><h2>Today's Tasks</h2><p>Keep your priorities clear.</p></div><button className="link-btn" onClick={onAdd}>+ Add task</button></div>
        <TaskList tasks={tasks.slice(0, 5)} onToggle={onToggle}/>
      </div>
      <div className="panel progress-card">
        <h2>Daily Progress</h2><p>Completed tasks</p><div className="big-progress"><div style={{width:`${stats.progress}%`}}></div></div><div className="progress-number">{stats.progress}%</div><span>{stats.completed} of {stats.total} tasks completed</span>
      </div>
    </div>
  </section>;
}

function StatCard({ label, value, icon }) { return <div className="stat-card"><div className="stat-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>; }

function TasksPage({ tasks, search, setSearch, filter, setFilter, onToggle, onDelete, onEdit, onAdd }) {
  return <section>
    <div className="toolbar"><div className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."/></div><select value={filter} onChange={e => setFilter(e.target.value)}><option>All</option><option>Pending</option><option>Completed</option></select><button className="primary-btn" onClick={onAdd}><Plus size={18}/> New Task</button></div>
    <div className="panel"><TaskList tasks={tasks} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} emptyMessage="No tasks found. Add a new task to get started."/></div>
  </section>;
}

function TaskList({ tasks, onToggle, onDelete, onEdit, emptyMessage='No tasks yet.' }) {
  if (!tasks.length) return <div className="empty"><ClipboardList size={38}/><p>{emptyMessage}</p></div>;
  return <div className="task-list">{tasks.map(task => <div className={`task-row ${task.completed ? 'done' : ''}`} key={task.id}>
    <button className="check-btn" onClick={() => onToggle(task.id)}>{task.completed ? <CheckCircle2/> : <Circle/>}</button>
    <div className="task-main"><strong>{task.title}</strong><span>Due {task.dueDate}</span></div>
    <span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span>
    {onEdit && <button className="icon-btn" onClick={() => onEdit(task)} title="Edit"><Pencil size={17}/></button>}
    {onDelete && <button className="icon-btn danger" onClick={() => onDelete(task.id)} title="Delete"><Trash2 size={17}/></button>}
  </div>)}</div>;
}

function Progress({ stats, tasks }) {
  const high = tasks.filter(t => t.priority === 'High').length;
  const medium = tasks.filter(t => t.priority === 'Medium').length;
  const low = tasks.filter(t => t.priority === 'Low').length;
  return <section className="progress-page"><div className="panel progress-overview"><div><p className="eyebrow">OVERALL COMPLETION</p><h2>{stats.progress}%</h2><p>{stats.completed} completed out of {stats.total} total tasks.</p></div><div className="circle-progress" style={{'--progress':`${stats.progress * 3.6}deg`}}><span>{stats.progress}%</span></div></div><div className="stats-grid"><StatCard label="High Priority" value={high} icon={<Target/>}/><StatCard label="Medium Priority" value={medium} icon={<Target/>}/><StatCard label="Low Priority" value={low} icon={<Target/>}/><StatCard label="Pending" value={stats.pending} icon={<Circle/>}/></div></section>;
}

function TaskModal({ task, onClose, onSave }) {
  const [form, setForm] = useState({ title: task?.title || '', priority: task?.priority || 'Medium', dueDate: task?.dueDate || '' });
  function submit(e) { e.preventDefault(); onSave(form); }
  return <div className="modal-backdrop"><div className="modal"><div className="modal-head"><div><h2>{task ? 'Edit Task' : 'Add New Task'}</h2><p>Enter the task details below.</p></div><button className="icon-btn" onClick={onClose}><X/></button></div><form onSubmit={submit}><label>Task title<input autoFocus value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="e.g. Complete assignment"/></label><div className="form-row"><label>Priority<select value={form.priority} onChange={e => setForm({...form,priority:e.target.value})}><option>High</option><option>Medium</option><option>Low</option></select></label><label>Due date<input type="date" value={form.dueDate} onChange={e => setForm({...form,dueDate:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit">{task ? 'Save Changes' : 'Add Task'}</button></div></form></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);

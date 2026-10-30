import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// --- API & Config ---
const API_BASE_URL = 'http://localhost:8000/api';
const WS_URL = 'ws://localhost:8765';

// --- SECURITY & SOC COMPONENTS (Phase 1) ---

const LiveLedgerFeed = () => {
  const [logs, setLogs] = useState([]);
  const feedEndRef = useRef(null);

  useEffect(() => {
    const generateHash = () => {
      const chars = 'abcdef0123456789';
      let hash = '';
      for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];
      return hash;
    };
    const interval = setInterval(() => {
      setLogs((prev) => [...prev, `[SYNC] Validated & Locked Hash: ${generateHash()}`].slice(-50));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-black border border-gray-700 rounded-md p-4 h-64 overflow-y-auto font-mono text-sm shadow-inner">
      <div className="text-green-500 mb-2 font-bold animate-pulse">MongoDB Immutable Ledger Connection [ACTIVE]</div>
      {logs.map((log, index) => <div key={index} className="text-green-400 opacity-80 mb-1">{log}</div>)}
      <div ref={feedEndRef} />
    </div>
  );
};

const ThreatAlertModal = () => {
  const [alertData, setAlertData] = useState(null);

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(WS_URL);
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'TAMPER_ALERT') setAlertData(data);
      };
      ws.onclose = () => setTimeout(connectWebSocket, 3000);
    };
    connectWebSocket();
  }, []);

  if (!alertData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-900 bg-opacity-90">
      <div className="bg-black border-4 border-red-600 p-8 rounded-lg shadow-2xl max-w-2xl w-full text-center animate-pulse">
        <h1 className="text-5xl font-black text-red-500 mb-4">CRITICAL SYSTEM ALERT</h1>
        <h2 className="text-2xl font-bold text-white mb-6">CRYPTOGRAPHIC INTEGRITY MISMATCH DETECTED</h2>
        <div className="bg-red-950 text-left p-4 rounded mb-6 font-mono text-sm border border-red-800">
          <p className="text-red-300"><span className="font-bold text-white">Compromised Entity:</span> Student ID {alertData.student_id}</p>
          <p className="text-red-300 mt-2"><span className="font-bold text-white">Tier 1 (Live DB) Hash:</span> <br/>{alertData.live_hash}</p>
          <p className="text-red-300 mt-2"><span className="font-bold text-white">Tier 2 (Locked Ledger) Hash:</span> <br/>{alertData.locked_hash}</p>
          <p className="text-yellow-400 font-bold mt-4">ACTION REQUIRED: Bypassed database-level modification detected.</p>
        </div>
        <button onClick={() => setAlertData(null)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded shadow-[0_0_15px_rgba(220,38,38,0.7)] transition-all">
          QUARANTINE RECORD & DISMISS
        </button>
      </div>
    </div>
  );
};

const SecurityMonitor = () => {
  const [isAttacking, setIsAttacking] = useState(false);
  const [simulationAlert, setSimulationAlert] = useState(null);
  const [simulationError, setSimulationError] = useState('');

  const simulateBreach = async () => {
    setIsAttacking(true);
    setSimulationError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/simulator/simulate-breach?student_id=1`);
      setSimulationAlert(response.data);
    } catch (error) {
      console.error("Demo alert simulation failed:", error);
      setSimulationError("Could not run the demo. Check that the backend API is available.");
    } finally {
      setIsAttacking(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-900 min-h-[calc(100vh-64px)] text-gray-200 rounded-lg mt-4 shadow-2xl">
      <div className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white tracking-wider flex items-center">
            <span className="bg-blue-600 text-white px-2 py-1 rounded mr-3 text-xl">CT-DIE</span> 
            Security Operations Center
          </h1>
          <p className="text-gray-400 mt-2 font-mono">Two-Tier Cryptographic Integrity Engine Status: ONLINE</p>
        </div>
        <button
          onClick={simulateBreach}
          disabled={isAttacking}
          className={`font-mono font-bold py-3 px-6 rounded border-2 transition-all ${
            isAttacking ? 'bg-gray-700 border-gray-600 text-gray-400' : 'bg-red-950 border-red-600 text-red-500 hover:bg-red-900 hover:text-white'
          }`}
        >
          {isAttacking ? '> GENERATING DEMO ALERT...' : '⚠ SIMULATE DANGER (SAFE DEMO)'}
        </button>
      </div>
      {simulationError && (
        <div role="alert" className="mb-6 rounded border border-red-700 bg-red-950 p-4 text-red-200">
          {simulationError}
        </div>
      )}
      {simulationAlert && (
        <section role="alert" className="mb-8 rounded-lg border-2 border-red-600 bg-red-950 p-5 text-red-100 shadow-lg">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-sm font-bold text-red-300">SIMULATED INTEGRITY ALERT</p>
              <h2 className="mt-1 text-xl font-black text-white">Hash mismatch detected — demo only</h2>
              <p className="mt-2 text-sm">{simulationAlert.message}</p>
              <p className="mt-2 text-sm">Demo student ID: {simulationAlert.compromised_student_id}</p>
            </div>
            <button
              onClick={() => setSimulationAlert(null)}
              className="rounded border border-red-400 px-3 py-1 text-sm hover:bg-red-900"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-4 grid gap-3 font-mono text-xs sm:grid-cols-2">
            <p className="break-all"><strong>Simulated live hash:</strong><br />{simulationAlert.live_hash}</p>
            <p className="break-all"><strong>Simulated ledger hash:</strong><br />{simulationAlert.locked_hash}</p>
          </div>
          <p className="mt-3 text-xs text-red-300">This demo does not modify student records or disable database protections.</p>
        </section>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-300 font-mono">Tier 2 Synchronization Feed</h2>
          <LiveLedgerFeed />
          <div className="bg-gray-800 p-4 rounded border border-gray-700 text-sm mt-4">
            <h3 className="font-bold text-blue-400 mb-2">How this works:</h3>
            <p className="text-gray-400">
              The Tier 1 RDBMS computes a cryptographic SHA-256 hash using <code className="bg-gray-900 px-1 rounded">pgcrypto</code>. 
              The Daemon syncs these to the Tier 2 MongoDB Ledger. Click <strong className="text-gray-200">Simulate Danger</strong> to display a mock hash-mismatch alert. It is a safe UI demonstration and does not change database records.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-300 font-mono">Live Operational Data (Tier 1)</h2>
          <div className="bg-gray-800 p-4 rounded border border-gray-700 text-sm flex items-center justify-center h-64">
             <p className="text-gray-500 font-mono">Real-time student table sync abstracted for SOC focus.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CRUD & DRIVE COMPONENTS (Phase 2) ---

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({ FullName: '', Email: '', Phone: '', CGPA: '', ActiveBacklogs: '', DepartmentID: '1', PlacedTier: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchStudents = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/placement/students`);
      setStudents(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, CGPA: parseFloat(formData.CGPA), ActiveBacklogs: parseInt(formData.ActiveBacklogs), DepartmentID: parseInt(formData.DepartmentID) };
      if (isEditing) {
        await axios.put(`${API_BASE_URL}/placement/students/${editId}`, payload);
      } else {
        await axios.post(`${API_BASE_URL}/placement/students`, payload);
      }
      setFormData({ FullName: '', Email: '', Phone: '', CGPA: '', ActiveBacklogs: '', DepartmentID: '1', PlacedTier: '' });
      setIsEditing(false);
      fetchStudents();
    } catch (err) { alert("Error saving student"); console.error(err); }
  };

  const handleEdit = (s) => {
    setFormData({ FullName: s.fullname, Email: s.email, Phone: s.phone, CGPA: s.cgpa, ActiveBacklogs: s.activebacklogs, DepartmentID: s.departmentid, PlacedTier: s.placedtier || '' });
    setIsEditing(true);
    setEditId(s.studentid);
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this student?")) {
      await axios.delete(`${API_BASE_URL}/placement/students/${id}`);
      fetchStudents();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Student Resource Management</h2>
      
      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Student' : 'Register New Student'}</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="border p-2 rounded" placeholder="Full Name" value={formData.FullName} onChange={e => setFormData({...formData, FullName: e.target.value})} required />
          <input className="border p-2 rounded" type="email" placeholder="Email" value={formData.Email} onChange={e => setFormData({...formData, Email: e.target.value})} required />
          <input className="border p-2 rounded" placeholder="Phone" value={formData.Phone} onChange={e => setFormData({...formData, Phone: e.target.value})} required />
          <input className="border p-2 rounded" type="number" step="0.01" placeholder="CGPA" value={formData.CGPA} onChange={e => setFormData({...formData, CGPA: e.target.value})} required />
          <input className="border p-2 rounded" type="number" placeholder="Active Backlogs" value={formData.ActiveBacklogs} onChange={e => setFormData({...formData, ActiveBacklogs: e.target.value})} required />
          <input className="border p-2 rounded" type="number" placeholder="Dept ID (1-50)" value={formData.DepartmentID} onChange={e => setFormData({...formData, DepartmentID: e.target.value})} required />
          <select className="border p-2 rounded" value={formData.PlacedTier} onChange={e => setFormData({...formData, PlacedTier: e.target.value})}>
            <option value="">-- Placed Tier (Optional) --</option>
            <option value="Mass">Mass</option>
            <option value="Core">Core</option>
            <option value="Dream">Dream</option>
          </select>
          <div className="md:col-span-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">{isEditing ? 'Update Student' : 'Add Student'}</button>
            {isEditing && <button type="button" onClick={() => setIsEditing(false)} className="ml-2 bg-gray-400 text-white px-4 py-2 rounded">Cancel</button>}
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGPA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Backlogs</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map(s => (
              <tr key={s.studentid}>
                <td className="px-4 py-3 text-sm">{s.studentid}</td>
                <td className="px-4 py-3 text-sm font-medium">{s.fullname}</td>
                <td className="px-4 py-3 text-sm">{parseFloat(s.cgpa).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm">{s.activebacklogs}</td>
                <td className="px-4 py-3 text-sm">{s.placedtier || '-'}</td>
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => handleEdit(s)} className="text-blue-600 hover:underline mr-3">Edit</button>
                  <button onClick={() => handleDelete(s.studentid)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [formData, setFormData] = useState({ CompanyName: '', Industry: '', ContactEmail: '', TierCategory: 'Mass' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/companies/`);
      setCompanies(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) await axios.put(`${API_BASE_URL}/companies/${editId}`, formData);
      else await axios.post(`${API_BASE_URL}/companies/`, formData);
      setFormData({ CompanyName: '', Industry: '', ContactEmail: '', TierCategory: 'Mass' });
      setIsEditing(false);
      fetchCompanies();
    } catch (err) { alert("Error saving company"); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete company?")) {
      await axios.delete(`${API_BASE_URL}/companies/${id}`);
      fetchCompanies();
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Company Management</h2>
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input className="border p-2 rounded" placeholder="Company Name" value={formData.CompanyName} onChange={e => setFormData({...formData, CompanyName: e.target.value})} required />
          <input className="border p-2 rounded" placeholder="Industry" value={formData.Industry} onChange={e => setFormData({...formData, Industry: e.target.value})} required />
          <input className="border p-2 rounded" type="email" placeholder="Contact Email" value={formData.ContactEmail} onChange={e => setFormData({...formData, ContactEmail: e.target.value})} required />
          <select className="border p-2 rounded" value={formData.TierCategory} onChange={e => setFormData({...formData, TierCategory: e.target.value})}>
            <option value="Mass">Mass</option>
            <option value="Core">Core</option>
            <option value="Dream">Dream</option>
          </select>
          <div className="md:col-span-4">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">{isEditing ? 'Update' : 'Add Company'}</button>
          </div>
        </form>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.map(c => (
              <tr key={c.companyid}>
                <td className="px-4 py-3 text-sm">{c.companyid}</td>
                <td className="px-4 py-3 text-sm font-medium">{c.companyname}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs ${c.tiercategory==='Dream' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}`}>{c.tiercategory}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <button onClick={() => handleDelete(c.companyid)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const EligibilityEngine = () => {
  const [driveId, setDriveId] = useState('');
  const [eligibleStudents, setEligibleStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runEngine = async () => {
    if(!driveId) return;
    setLoading(true); setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/placement/drives/${driveId}/automated_eligibility`);
      setEligibleStudents(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to run engine. Check Drive ID.");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Automated Eligibility Engine</h2>
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <p className="text-gray-600 mb-4">Execute complex SQL joins to strictly filter candidates based on Drive criteria (Min CGPA, Max Backlogs) and Institutional Policies (Dream tier exclusion).</p>
        <div className="flex gap-4">
          <input 
            type="number" 
            placeholder="Enter Placement Drive ID (e.g., 1-50)" 
            className="border p-2 rounded flex-1 max-w-xs"
            value={driveId}
            onChange={(e) => setDriveId(e.target.value)}
          />
          <button onClick={runEngine} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold transition-colors">
            {loading ? 'Executing Engine...' : 'Run Eligibility Engine 🚀'}
          </button>
        </div>
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>

      {eligibleStudents.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <div className="p-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
            <h3 className="font-bold text-green-800">✅ Verified Eligible Pool: {eligibleStudents.length} Students</h3>
            <span className="text-sm text-green-600">Target: {eligibleStudents[0]?.companyname}</span>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGPA</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {eligibleStudents.map(s => (
                <tr key={s.studentid}>
                  <td className="px-4 py-3 text-sm">{s.studentid}</td>
                  <td className="px-4 py-3 text-sm font-medium">{s.fullname}</td>
                  <td className="px-4 py-3 text-sm">{parseFloat(s.cgpa).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{s.placedtier || 'Unplaced'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- NEW TRACKING & REPORTING COMPONENTS (Phase 3) ---

const ApplicationTracker = () => {
  const [applications, setApplications] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [newStatus, setNewStatus] = useState('TECHNICAL_ROUND');
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/applications/`);
        setApplications(response.data);
        setLoadError('');
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        setLoadError("Could not load applications. Check that the backend API is available.");
      }
    };
    fetchApplications();
  }, []);

  const handleCheckboxChange = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) return alert("Select at least one application.");
    try {
      const res = await axios.put(`${API_BASE_URL}/applications/batch-update`, {
        application_ids: selectedIds,
        new_status: newStatus
      });
      alert(res.data.message);
      setApplications(apps => apps.map(app =>
        selectedIds.includes(app.applicationid) ? { ...app, finalstatus: newStatus } : app
      ));
      setSelectedIds([]);
    } catch (err) {
      console.error(err);
      alert("Error performing batch update.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Application Tracker (Batch Process)</h2>
      
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex items-center gap-4">
        <span className="font-semibold text-gray-700">Batch Update Selected ({selectedIds.length}):</span>
        <select 
          className="border p-2 rounded flex-1 max-w-xs" 
          value={newStatus} 
          onChange={(e) => setNewStatus(e.target.value)}
        >
          <option value="TECHNICAL_ROUND">Move to Technical Round</option>
          <option value="HR_ROUND">Move to HR Round</option>
          <option value="HIRED">Mark as HIRED</option>
          <option value="REJECTED">Mark as REJECTED</option>
        </select>
        <button 
          onClick={handleBatchUpdate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold transition-colors disabled:opacity-50"
          disabled={selectedIds.length === 0}
        >
          Execute Batch SQL Update
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loadError && <p role="alert" className="p-4 text-red-600">{loadError}</p>}
        {!loadError && applications.length === 0 && (
          <p className="p-4 text-gray-600">No applications found. Load the demo data to populate this table.</p>
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <input 
                  type="checkbox" 
                  onChange={(e) => setSelectedIds(e.target.checked ? applications.map(a => a.applicationid) : [])}
                  checked={selectedIds.length === applications.length && applications.length > 0}
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">App ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {applications.map(app => (
              <tr key={app.applicationid} className={selectedIds.includes(app.applicationid) ? 'bg-indigo-50' : ''}>
                <td className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(app.applicationid)}
                    onChange={() => handleCheckboxChange(app.applicationid)}
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">#{app.applicationid}</td>
                <td className="px-4 py-3 text-sm font-medium">{app.studentname}</td>
                <td className="px-4 py-3 text-sm">{app.companyname}</td>
                <td className="px-4 py-3 text-sm font-bold text-gray-600">{app.finalstatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [deptStats, setDeptStats] = useState([]);
  const [companyStats, setCompanyStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deptRes = await axios.get(`${API_BASE_URL}/reports/department-placements`);
        setDeptStats(deptRes.data);
        const compRes = await axios.get(`${API_BASE_URL}/reports/company-conversions`);
        setCompanyStats(compRes.data);
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
      }
    };
    fetchData();
  }, []);

  const handleExportCSV = () => {
    alert("Triggering Report Generation... \n\n(In a full production environment, this would format the SQL aggregated data into a downloadable CSV blob.)");
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">SQL Analytics & Reports</h2>
        <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow">
          Download CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dept Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Department-Wise Placements</h3>
          <p className="text-sm text-gray-500 mb-4 font-mono">SELECT ... GROUP BY DepartmentName</p>
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Students</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deptStats.map((stat, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-800">{stat.departmentname}</td>
                    <td className="px-4 py-2 text-sm text-right">{stat.totalstudents}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold text-green-600">{stat.placedcount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Company Conversions</h3>
          <p className="text-sm text-gray-500 mb-4 font-mono">SELECT ... GROUP BY CompanyName</p>
          <div className="overflow-y-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Apps</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {companyStats.map((stat, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-sm text-gray-800">{stat.companyname}</td>
                    <td className="px-4 py-2 text-sm text-right">{stat.totalapplications}</td>
                    <td className="px-4 py-2 text-sm text-right font-bold text-indigo-600">{stat.totalhired}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [currentView, setCurrentView] = useState('students');

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <ThreatAlertModal />
      
      {/* Dynamic Navigation */}
      <nav className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <span className="text-white font-bold text-xl tracking-tight mr-4">VeriPlace</span>
              <div className="flex space-x-1 overflow-x-auto">
                {['students', 'companies', 'eligibility', 'tracker', 'analytics', 'security'].map(view => (
                  <button 
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors capitalize whitespace-nowrap
                      ${currentView === view ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                      ${view === 'security' && currentView !== 'security' ? 'text-red-400' : ''}
                      ${view === 'security' && currentView === 'security' ? 'bg-red-900' : ''}
                    `}
                  >
                    {view.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* View Routing */}
      <main className="pb-12">
        {currentView === 'students' && <StudentManagement />}
        {currentView === 'companies' && <CompanyManagement />}
        {currentView === 'eligibility' && <EligibilityEngine />}
        {currentView === 'tracker' && <ApplicationTracker />}
        {currentView === 'analytics' && <AnalyticsDashboard />}
        {currentView === 'security' && <SecurityMonitor />}
      </main>
    </div>
  );
}
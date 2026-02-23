const API_URL = '/api';
let currentUser = JSON.parse(localStorage.getItem('user'));
let token = localStorage.getItem('token');

// Navigation
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateNav() {
    const navLinks = document.getElementById('navLinks');
    if (token && currentUser) {
        navLinks.innerHTML = `
            <a href="#" onclick="showDashboard()" style="font-weight: 600; color: var(--accent);">Dashboard</a>
            <a href="#" onclick="logout()" class="btn btn-outline" style="padding: 0.4rem 1rem;">Logout (${currentUser.name.split(' ')[0]})</a>
        `;
    } else {
        navLinks.innerHTML = `
            <a href="#" onclick="showSection('landing')">Home</a>
            <a href="#" onclick="showSection('login')">Login</a>
            <a href="#" onclick="showSection('register')" class="btn btn-primary" style="color: white; padding: 0.4rem 1rem;">Sign Up</a>
        `;
    }
}

function showDashboard() {
    if (!currentUser) return showSection('login');
    if (currentUser.role === 'patient') {
        showSection('patientDashboard');
        loadPatientCases();
    } else if (currentUser.role === 'doctor') {
        showSection('doctorDashboard');
        loadDoctorCases();
    } else if (currentUser.role === 'admin') {
        showSection('adminDashboard');
        loadAdminDashboard();
    }
}

// Auth
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Signing in...';
    btn.disabled = true;

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            token = data.token;
            currentUser = data.user;
            updateNav();
            showDashboard();
        } else {
            alert(data.error || 'Login failed. Please check your credentials.');
        }
    } catch (err) {
        alert('Error connecting to server. Please ensure the backend is running.');
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        if (res.ok) {
            alert('Registration successful! You can now log in.');
            showSection('login');
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (err) {
        alert('Error connecting to server');
    } finally {
        btn.disabled = false;
    }
});

function logout() {
    localStorage.clear();
    token = null;
    currentUser = null;
    updateNav();
    showSection('landing');
}

// Patient Actions
document.getElementById('caseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.innerText = 'Uploading...';
    btn.disabled = true;

    const formData = new FormData();
    formData.append('description', document.getElementById('caseDesc').value);
    formData.append('medicalFile', document.getElementById('caseFile').files[0]);

    try {
        const res = await fetch(`${API_URL}/cases`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            alert('Case submitted successfully! A doctor will review it soon.');
            document.getElementById('caseForm').reset();
            loadPatientCases();
        }
    } catch (err) {
        alert('Error submitting case');
    } finally {
        btn.innerText = 'Submit Case to Doctor';
        btn.disabled = false;
    }
});

async function loadPatientCases() {
    try {
        const res = await fetch(`${API_URL}/cases`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cases = await res.json();
        const tbody = document.querySelector('#patientCasesTable tbody');
        if (cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 2rem; color: var(--text-muted);">No consultations found.</td></tr>';
            return;
        }
        tbody.innerHTML = cases.map(c => `
            <tr>
                <td style="font-weight: 500;">${new Date(c.uploadDate).toLocaleDateString()}</td>
                <td>${c.description}</td>
                <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
                <td style="color: ${c.doctorResponse ? 'var(--text-main)' : 'var(--text-muted)'}; font-style: ${c.doctorResponse ? 'normal' : 'italic'};">
                    ${c.doctorResponse || 'Pending review...'}
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

// Doctor Actions
async function loadDoctorCases() {
    try {
        const res = await fetch(`${API_URL}/cases`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cases = await res.json();
        const tbody = document.querySelector('#doctorCasesTable tbody');
        const activeCases = cases.filter(c => c.status !== 'Closed');
        
        if (activeCases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 2rem; color: var(--text-muted);">No pending cases to review.</td></tr>';
            return;
        }

        tbody.innerHTML = activeCases.map(c => `
            <tr>
                <td style="font-weight: 600;">${c.patient.name}</td>
                <td>${c.description}</td>
                <td><a href="/${c.patientFile}" target="_blank" class="btn btn-outline" style="padding: 0.3rem 0.7rem; font-size: 0.8rem;">📄 View File</a></td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="openResponseModal('${c._id}')">Respond</button>
                        <button class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="closeCase('${c._id}')">Close</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

function openResponseModal(caseId) {
    document.getElementById('respCaseId').value = caseId;
    document.getElementById('responseModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('responseModal').classList.add('hidden');
}

document.getElementById('responseForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const caseId = document.getElementById('respCaseId').value;
    const formData = new FormData();
    formData.append('response', document.getElementById('respText').value);
    if (document.getElementById('respFile').files[0]) {
        formData.append('prescriptionFile', document.getElementById('respFile').files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/cases/${caseId}/respond`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.ok) {
            alert('Response sent successfully!');
            closeModal();
            loadDoctorCases();
        }
    } catch (err) {
        alert('Error sending response');
    }
});

async function closeCase(caseId) {
    if (!confirm('Are you sure you want to close this case? This will archive the patient files for security.')) return;
    try {
        const res = await fetch(`${API_URL}/cases/${caseId}/close`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            alert('Case closed and files archived.');
            loadDoctorCases();
        }
    } catch (err) {
        alert('Error closing case');
    }
}

// Admin Actions
async function loadAdminDashboard() {
    try {
        const statsRes = await fetch(`${API_URL}/cases/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const stats = await statsRes.json();
        document.getElementById('statTotal').innerText = stats.totalCases;
        document.getElementById('statPending').innerText = stats.pendingCases;
        document.getElementById('statClosed').innerText = stats.closedCases;

        const casesRes = await fetch(`${API_URL}/cases`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cases = await casesRes.json();
        const tbody = document.querySelector('#adminCasesTable tbody');
        
        if (cases.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center" style="padding: 2rem; color: var(--text-muted);">No system activity recorded.</td></tr>';
            return;
        }

        tbody.innerHTML = cases.map(c => `
            <tr>
                <td style="font-weight: 600;">${c.patient.name}</td>
                <td>${c.doctor ? c.doctor.name : '<span style="color: var(--text-muted)">Unassigned</span>'}</td>
                <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">
                    ${c.lifecycleLog.length > 0 ? c.lifecycleLog[c.lifecycleLog.length-1].action : 'No events'}
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

// Init
updateNav();
if (token) showDashboard();
else showSection('landing');

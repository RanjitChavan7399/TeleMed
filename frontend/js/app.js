const API_URL = 'http://13.60.240.36:5000/api';
let currentUser = JSON.parse(localStorage.getItem('user'));
let token = localStorage.getItem('token');

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
        switchPatientTab('cases');
    } else if (currentUser.role === 'doctor') {
        showSection('doctorDashboard');
        switchDoctorTab('cases');
    } else if (currentUser.role === 'admin') {
        showSection('adminDashboard');
        switchAdminTab('cases');
    }
}

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
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 0; border: none; background: transparent; text-align: center;"><div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <h4>No Consultations Found</h4>
                <p>You haven't submitted any medical requests yet.</p>
            </div></td></tr>`;
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

async function loadDoctorCases() {
    try {
        const res = await fetch(`${API_URL}/cases`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cases = await res.json();
        const tbody = document.querySelector('#doctorCasesTable tbody');
        const activeCases = cases.filter(c => c.status !== 'Closed');
        
        if (activeCases.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 0; border: none; background: transparent; text-align: center;"><div class="empty-state">
                <i class="fa-solid fa-check-double" style="color: var(--success);"></i>
                <h4>All Caught Up!</h4>
                <p>There are no pending patient requests to review.</p>
            </div></td></tr>`;
            return;
        }

        tbody.innerHTML = activeCases.map(c => `
            <tr>
                <td style="font-weight: 600;">${c.patient.name}</td>
                <td>${c.description}</td>
		<td>
		    ${c.patientFileUrl && c.patientFileUrl !== ""
		     ? `<a href="${c.patientFileUrl}" target="_blank" class="btn btn-outline" style="padding:0.3rem 0.7rem;font-size:0.8rem;">📄 View File</a>`
 		     : 'No File'}
		</td>
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
            tbody.innerHTML = `<tr><td colspan="4" style="padding: 0; border: none; background: transparent; text-align: center;"><div class="empty-state">
                <i class="fa-solid fa-box-archive" style="color: var(--warning);"></i>
                <h4>No System Activity</h4>
                <p>No lifecycle events or cases have been generated yet.</p>
            </div></td></tr>`;
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

updateNav();
if (token) showDashboard();
else showSection('landing');

// --- TAB SWITCHING LOGIC ---
function switchPatientTab(tab) {
    document.getElementById('patTabCases').classList.remove('active');
    document.getElementById('patTabAppts').classList.remove('active');
    document.getElementById('patCasesView').style.display = 'none';
    document.getElementById('patApptsView').style.display = 'none';

    if (tab === 'cases') {
        document.getElementById('patTabCases').classList.add('active');
        document.getElementById('patCasesView').style.display = 'flex';
        loadPatientCases();
    } else {
        document.getElementById('patTabAppts').classList.add('active');
        document.getElementById('patApptsView').style.display = 'flex';
        loadPatientAppointments();
        populateDoctorsDropdown();
    }
}

function switchDoctorTab(tab) {
    document.getElementById('docTabCases').classList.remove('active');
    document.getElementById('docTabAppts').classList.remove('active');
    document.getElementById('docCasesView').style.display = 'none';
    document.getElementById('docApptsView').style.display = 'none';

    if (tab === 'cases') {
        document.getElementById('docTabCases').classList.add('active');
        document.getElementById('docCasesView').style.display = 'block';
        loadDoctorCases();
    } else {
        document.getElementById('docTabAppts').classList.add('active');
        document.getElementById('docApptsView').style.display = 'block';
        loadDoctorAppointments();
    }
}

function switchAdminTab(tab) {
    document.getElementById('adminTabCases').classList.remove('active');
    document.getElementById('adminTabAppts').classList.remove('active');
    document.getElementById('adminCasesView').style.display = 'none';
    document.getElementById('adminApptsView').style.display = 'none';

    if (tab === 'cases') {
        document.getElementById('adminTabCases').classList.add('active');
        document.getElementById('adminCasesView').style.display = 'block';
        loadAdminDashboard();
    } else {
        document.getElementById('adminTabAppts').classList.add('active');
        document.getElementById('adminApptsView').style.display = 'block';
        loadAdminAppointments();
    }
}

// --- APPOINTMENT LOGIC ---
async function populateDoctorsDropdown() {
    try {
        const res = await fetch(`${API_URL}/auth/doctors`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const doctors = await res.json();
        const select = document.getElementById('apptDoctor');
        if (doctors.length === 0) {
            select.innerHTML = '<option value="">No doctors available</option>';
            return;
        }
        select.innerHTML = doctors.map(d => `<option value="${d._id}">Dr. ${d.name}</option>`).join('');
    } catch (e) {
        console.error('Error fetching doctors:', e);
    }
}

if(document.getElementById('appointmentForm')){
document.getElementById('appointmentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;

    const data = {
        doctor: document.getElementById('apptDoctor').value,
        date: document.getElementById('apptDate').value,
        time: document.getElementById('apptTime').value,
        reason: document.getElementById('apptReason').value
    };

    try {
        const res = await fetch(`${API_URL}/appointments`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Appointment booked successfully!');
            document.getElementById('appointmentForm').reset();
            loadPatientAppointments();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to book appointment');
        }
    } catch (e) {
        alert('Server connection error');
    } finally {
        btn.disabled = false;
    }
});
}

async function loadPatientAppointments() {
    try {
        const res = await fetch(`${API_URL}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const appts = await res.json();
        const tbody = document.querySelector('#patientApptsTable tbody');
        if (appts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="padding: 1rem; text-align:center;"><div class="empty-state" style="padding: 1rem;"><i class="fa-solid fa-calendar-xmark" style="font-size: 2rem; color: var(--text-muted); margin-bottom:0.5rem; display:block;"></i>No appointments found.</div></td></tr>`;
            return;
        }
        tbody.innerHTML = appts.map(a => `
            <tr style="background: var(--bg-card); transition: all 0.3s ease;">
                <td style="font-weight: 500;">Dr. ${a.doctor ? a.doctor.name : 'Unknown'}</td>
                <td><i class="fa-regular fa-calendar" style="color: var(--primary); margin-right: 0.3rem;"></i> ${a.date}</td>
                <td><i class="fa-regular fa-clock" style="color: var(--accent); margin-right: 0.3rem;"></i> ${a.time}</td>
                <td>${a.reason}</td>
                <td><span class="badge badge-${a.status === 'Completed' ? 'success' : (a.status === 'Cancelled' ? 'danger' : 'warning')}">${a.status}</span></td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function loadDoctorAppointments() {
    try {
        const res = await fetch(`${API_URL}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const appts = await res.json();
        const tbody = document.querySelector('#doctorApptsTable tbody');
        if (appts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="padding: 1rem; text-align:center;"><div class="empty-state" style="padding: 1rem;"><i class="fa-solid fa-calendar-check" style="color: var(--success); font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>No upcoming appointments.</div></td></tr>`;
            return;
        }
        tbody.innerHTML = appts.map(a => `
            <tr>
                <td style="font-weight: 600;">${a.patient ? a.patient.name : 'Unknown'}</td>
                <td>${a.date}</td>
                <td>${a.time}</td>
                <td>${a.reason}</td>
                <td><span class="badge badge-${a.status === 'Completed' ? 'success' : (a.status === 'Cancelled' ? 'danger' : 'warning')}">${a.status}</span></td>
                <td>
                    ${a.status === 'Scheduled' ? `
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-success" style="padding:0.4rem 0.8rem;font-size:0.8rem;" onclick="updateApptStatus('${a._id}', 'Completed')"><i class="fa-solid fa-check"></i> Complete</button>
                        <button class="btn btn-danger" style="padding:0.4rem 0.8rem;font-size:0.8rem;" onclick="updateApptStatus('${a._id}', 'Cancelled')"><i class="fa-solid fa-xmark"></i> Cancel</button>
                    </div>
                    ` : '-'}
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function loadAdminAppointments() {
    try {
        const res = await fetch(`${API_URL}/appointments`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) return;
        const appts = await res.json();
        const tbody = document.querySelector('#adminApptsTable tbody');
        if (appts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 1rem;">No appointments platform-wide.</td></tr>`;
            return;
        }
        tbody.innerHTML = appts.map(a => `
            <tr>
                <td style="font-weight: 500;">${a.patient ? a.patient.name : 'Unknown'}</td>
                <td>Dr. ${a.doctor ? a.doctor.name : 'Unknown'}</td>
                <td>${a.date}</td>
                <td>${a.time}</td>
                <td><span class="badge badge-${a.status === 'Completed' ? 'success' : (a.status === 'Cancelled' ? 'danger' : 'warning')}">${a.status}</span></td>
            </tr>
        `).join('');
    } catch (e) { console.error(e); }
}

async function updateApptStatus(id, status) {
    if (!confirm(`Mark appointment as ${status}?`)) return;
    try {
        const res = await fetch(`${API_URL}/appointments/${id}/status`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status })
        });
        if (res.ok) {
            loadDoctorAppointments();
        } else {
             alert('Failed to update status');
        }
    } catch (e) {
        console.error(e);
        alert('Error updating status');
    }
}


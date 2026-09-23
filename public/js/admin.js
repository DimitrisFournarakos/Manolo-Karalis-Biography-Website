// --- ADMIN PANEL ---
//JWT (JSON Web Token) Authentication (το token κάθε φορά αποθηκεύεται στο localStorage για την επαλήθευση κάθε αιτήματος προς τον server)
//Eναλλαγή φορμών Διαχείρισης,Eπιβεβαίωση ενεργειών και τη διαδικασία Aποσύνδεσης χρήστη
//Διασφαλίζει την ασφάλεια των δεδομένων επιτρέποντας τροποποιήσεις στη βάση δεδομένων μόνο
//από τον διαχειριστή μέσω προστατευμένων API endpoints.
let jwtToken = localStorage.getItem('token') || null;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const adminMainView = document.getElementById('admin-main-view');

    // --- Σύνδεση ---
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const result = await response.json();

            if (result.success) {
                jwtToken = result.token;
                localStorage.setItem('token', jwtToken);
                alert("Επιτυχής Σύνδεση!");
                document.getElementById('login-container').classList.add('hidden');
                adminMainView?.classList.remove('hidden');
                document.getElementById('menu-login')?.classList.add('hidden');
                document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
            } else {
                alert(result.message);
            }
        } catch (error) { alert("Σφάλμα σύνδεσης."); }
    });

    // --- Aside Menu Listeners ---
    document.querySelectorAll('.parent-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            link.nextElementSibling?.classList.toggle('hidden');
        });
    });

    document.getElementById('link-add-dist')?.addEventListener('click', (e) => { e.preventDefault(); showDistinctionForm(); });
    document.getElementById('link-edit-dist')?.addEventListener('click', (e) => { e.preventDefault(); showEditForm("distinctions"); });
    document.getElementById('link-add-link')?.addEventListener('click', (e) => { e.preventDefault(); showLinksForm(); });
    document.getElementById('link-edit-link')?.addEventListener('click', (e) => { e.preventDefault(); showEditForm("links"); });
    
    document.getElementById('link-logout')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        location.reload();
    });
});

function prepareMainView() {
    const welcomeMsg = document.getElementById('admin-welcome-msg');
    const container = document.getElementById('management-form-container');
    if (welcomeMsg) welcomeMsg.style.display = 'none';
    if (container) container.innerHTML = '';
}

// --- ΕΜΦΑΝΙΣΗ ΠΙΝΑΚΑ ---
async function showEditForm(type) {
    prepareMainView();
    const container = document.getElementById('management-form-container');
    container.innerHTML = `<h4>Διαχείριση ${type === 'links' ? 'Συνδέσμων' : 'Διακρίσεων'}</h4><p>Φόρτωση...</p>`;

    try {
        const response = await fetch(`/api/all/${type}`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        const data = await response.json();

        let html = `<table class="admin-table">
            <thead><tr><th>Κατηγορία</th><th>Τίτλος</th><th>Ενέργεια</th></tr></thead>
            <tbody>`;

        for (const category in data) {
            data[category].forEach((item, index) => {
                // Εδώ παίρνουμε την αξία (url για links, value για distinctions)
                const currentVal = (type === 'links') ? item.url : item.value;
                
                html += `
                    <tr>
                        <td>${category}</td>
                        <td>${item.title}</td>
                        <td>
                            <button class="edit-btn" 
                                data-type="${type}" 
                                data-cat="${category}" 
                                data-idx="${index}" 
                                data-title="${item.title}" 
                                data-val="${currentVal || ''}">Αλλαγή</button>
                            <button class="delete-btn" onclick="deleteItem('${type}', '${category}', ${index})">Διαγραφή</button>
                        </td>
                    </tr>`;
            });
        }
        html += `</tbody></table>`;
        container.innerHTML = `<h4>Διαχείριση ${type === 'links' ? 'Συνδέσμων' : 'Διακρίσεων'}</h4>` + html;

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const d = this.dataset;
                editItem(d.type, d.cat, d.idx, d.title, d.val);
            });
        });
    } catch (error) { container.innerHTML = "<p>Σφάλμα φόρτωσης.</p>"; }
}

// --- ΦΟΡΜΑ ΕΠΕΞΕΡΓΑΣΙΑΣ ---
function editItem(type, category, index, oldTitle, oldVal) {
    prepareMainView();
    const container = document.getElementById('management-form-container');
    
    const labelTitle = (type === 'distinctions') ? 'Τίτλος / Περιγραφή:' : 'Τίτλος:';
    const labelVal = (type === 'distinctions') ? 'Πληροφορίες / Links:' : 'URL Συνδέσμου:';

    container.innerHTML = `
        <div class="admin-form-box">
            <h4>Επεξεργασία</h4>
            <form id="edit-data-form">
                <label>${labelTitle}</label>
                <input type="text" id="edit-title" value="${oldTitle}" required>
                
                <label>${labelVal}</label>
                <input type="text" id="edit-val" value="${oldVal}" required>
                
                <div style="margin-top:15px;">
                    <button type="submit" class="save-btn">Ενημέρωση</button>
                    <button type="button" class="cancel-btn" onclick="showEditForm('${type}')">Ακύρωση</button>
                </div>
            </form>
        </div>`;

    document.getElementById('edit-data-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Στέλνουμε το σωστό key (url ή value) ανάλογα με τον τύπο
        const updatedItem = { title: document.getElementById('edit-title').value };
        if (type === 'links') {
            updatedItem.url = document.getElementById('edit-val').value;
        } else {
            updatedItem.value = document.getElementById('edit-val').value;
        }

        try {
            const response = await fetch(`/api/update/${type}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwtToken}` 
                },
                body: JSON.stringify({ category, index: parseInt(index), item: updatedItem })
            });

            const result = await response.json();
            if (result.success) {
                alert("Η ενημέρωση ολοκληρώθηκε επιτυχώς!");
                showEditForm(type);
            } else {
                alert("Αποτυχία ενημέρωσης: " + (result.message || "Σφάλμα Server"));
            }
        } catch (err) {
            alert("Σφάλμα σύνδεσης με τον server.");
        }
    });
}

// --- ΔΙΑΓΡΑΦΗ ---
async function deleteItem(type, category, index) {
    if (!confirm("Θέλετε σίγουρα διαγραφή;")) return;
    try {
        const response = await fetch(`/api/delete/${type}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
            body: JSON.stringify({ category, index })
        });
        const result = await response.json();
        if (result.success) {
            alert("Διαγράφηκε!");
            showEditForm(type);
        }
    } catch (e) { alert("Σφάλμα κατά τη διαγραφή."); }
}

// --- ΠΡΟΣΘΗΚΗ ΝΕΩΝ ---
function showDistinctionForm() {
    prepareMainView();
    document.getElementById('management-form-container').innerHTML = `
        <div class="admin-form-box">
            <h4>Πρόσθεση Διάκρισης</h4>
            <form id="add-data-form">
                <input type="text" placeholder="Τίτλος / Περιγραφή" required id="title">
                <input type="text" placeholder="Πληροφορίες / Links" required id="value">
                <select id="category">
                    <option value="national">Εθνικές</option>
                    <option value="international">Διεθνείς</option>
                    <option value="records">Ρεκόρ</option>
                </select>
                <button type="submit" class="save-btn">Αποθήκευση</button>
            </form>
        </div>`;
    setupFormSubmit("distinctions");
}

function showLinksForm() {
    prepareMainView();
    document.getElementById('management-form-container').innerHTML = `
        <div class="admin-form-box">
            <h4>Πρόσθεση Συνδέσμου</h4>
            <form id="add-data-form">
                <input type="text" placeholder="Τίτλος" required id="title">
                <input type="url" placeholder="URL" required id="url">
                <select id="category">
                    <option value="interviews">Συνεντεύξεις</option>
                    <option value="video">Βίντεο</option>
                    <option value="web links">Web Links</option>
                </select>
                <button type="submit" class="save-btn">Αποθήκευση</button>
            </form>
        </div>`;
    setupFormSubmit("links");
}

function setupFormSubmit(type) {
    document.getElementById('add-data-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = {
            category: document.getElementById('category').value,
            item: {
                title: document.getElementById('title').value,
                [type === 'links' ? 'url' : 'value']: document.getElementById(type === 'links' ? 'url' : 'value').value
            }
        };
        const response = await fetch(`/api/add/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwtToken}` },
            body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.success) {
            alert("Αποθηκεύτηκε!");
            showEditForm(type);
        }
    });
}
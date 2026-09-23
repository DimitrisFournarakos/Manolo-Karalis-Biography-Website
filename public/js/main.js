document.addEventListener('DOMContentLoaded', function () {

    // ---  ΕΠΙΛΟΓΗ ΣΤΟΙΧΕΙΩΝ ---
    const navLinks = document.querySelectorAll('.menu a');
    const submenuContainers = document.querySelectorAll('.submenu-container');
    const mainContentContainers = document.querySelectorAll('.main-content-section');

    const photoGroupLinks = document.querySelectorAll('#photos-submenu .photo-group-link');
    const photoGroupContainers = document.querySelectorAll('#photos-content .photo-group-content');
    const photosIntro = document.getElementById('photos-intro'); 

    const bioIntro = document.getElementById('bio-intro');
    const bioLinks = document.querySelectorAll('.bio-link');
    const bioSections = document.querySelectorAll('.bio-section');

    // --- ΚΕΝΤΡΙΚΟ ΜΕΝΟΥ (Navigation) ---
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const section = this.getAttribute('datasection');
            
            // Απόκρυψη όλων των υπομενού και περιεχομένων
            submenuContainers.forEach(c => c.classList.add('hidden'));
            mainContentContainers.forEach(c => c.classList.add('hidden'));

            // Εμφάνιση της επιλεγμένης ενότητας
            const targetSubmenu = document.getElementById(section + '-submenu');
            if (targetSubmenu) targetSubmenu.classList.remove('hidden');

            const targetContent = document.getElementById(section + '-content');
            if (targetContent) targetContent.classList.remove('hidden');

            // --- ΕΠΑΝΑΦΟΡΑ ΕΙΣΑΓΩΓΙΚΩΝ ΚΕΙΜΕΝΩΝ ---
            // Κάθε φορά που αλλάζουμε κεντρική ενότητα, δείχνουμε το Intro και κρύβουμε παλιά αποτελέσματα
            
            const introBox = targetContent?.querySelector('.intro-box') || document.getElementById(section + '-intro');
            const resultsDiv = document.getElementById(section + '-results');//Το βάζουμε για τις Διακρίσεις και τους Συνδέσμους για να εμφανίζει τους πίνακες με τα ρεκορ,διακρισεις κλπ.

            if (introBox) introBox.classList.remove('hidden-group', 'hidden'); 
            if (resultsDiv) resultsDiv.innerHTML = ''; // Καθαρισμός προηγούμενων πινάκων API
                                                       //Κάθε φορά που ο χρήστης πατάει μια κεντρική ενότητα (Βιογραφία, Φωτογραφίες, Διακρίσεις, Σύνδεσμοι)
                                                       //Σβήνονται τυχόν παλιοί πίνακες ή αποτελέσματα αναζήτησης και εμφανίζεται ξανά το εισαγωγικό κείμενο.

            // Ειδικά για Φωτογραφίες & Βιογραφία (Reset εσωτερικών τμημάτων)
            if (section === 'photos') {
                photoGroupContainers.forEach(c => c.classList.add('hidden-group'));
            } else if (section === 'bio') {
                bioSections.forEach(sec => sec.classList.add('hidden'));
            }
        });
    });

    // --- ΥΠΟΜΕΝΟΥ ΦΩΤΟΓΡΑΦΙΩΝ ---
    photoGroupLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const group = this.getAttribute('data-group');
            // Κρύβουμε την εισαγωγή φωτογραφιών
            if (photosIntro) photosIntro.classList.add('hidden-group');
            // Εμφανίζουμε το σωστό άλμπουμ
            photoGroupContainers.forEach(c => c.classList.add('hidden-group'));
            const targetGroup = document.getElementById('photos-' + group);
            if (targetGroup) targetGroup.classList.remove('hidden-group');
        });
    });

    // --- ΥΠΟΜΕΝΟΥ ΒΙΟΓΡΑΦΙΑΣ ---
    bioLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = this.getAttribute('data-bio');
            if (bioIntro) bioIntro.classList.add('hidden');
            bioSections.forEach(s => s.classList.add('hidden'));
            const targetSection = document.getElementById(`bio-${target}`);
            if (targetSection) targetSection.classList.remove('hidden');
        });
    });
});

// --- ΦΟΡΤΩΣΗ ΔΕΔΟΜΕΝΩΝ ΑΠΟ API ---
async function loadDynamicContent(type, category) {
    let resultsContainer = document.getElementById(`${type}-results`);
    const mainSection = document.getElementById(`${type}-content`);
    const introBox = document.querySelector(`#${type}-content .intro-box`) || document.getElementById(`${type}-intro`);
    
    // Αν δεν υπάρχει το container αποτελεσμάτων στο HTML, το δημιουργούμε,του δίνουμε id και το προσθέτουμε στο main section,για ασφάλεια το έχουμε βάλει
    if (!resultsContainer && mainSection) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = `${type}-results`;
        mainSection.appendChild(resultsContainer);
    }

    // Κρύβουμε το στατικό intro κείμενο του HTML για να δείξουμε τα αποτελέσματα
    if (introBox) introBox.classList.add('hidden-group');
    if (resultsContainer) resultsContainer.innerHTML = "<h2>Φόρτωση...</h2>";
    
    try {
        const response = await fetch(`/api/${type}/${category}`);
        const data = await response.json();

        const categoryTitleMap = {
            national: "Εθνικές Διακρίσεις",
            international: "Διεθνείς Διακρίσεις",
            records: "Ρεκόρ",
            interviews: "Συνεντεύξεις",
            video: "Βίντεο",
            web_links: "Διαδικτυακοί Σύνδεσμοι"
        };

        let htmlTable = `<table border="1" class="data-table">
            <thead><tr><th>Περιγραφή</th><th>${type === 'links' ? 'Σύνδεσμος' : 'Πληροφορίες'}</th></tr></thead>
            <tbody>`;

        data.forEach(item => {
            let infoCell = (type === 'links') 
                ? `<a href="${item.url}" target="_blank" class="action-link">Μετάβαση</a>` 
                : (item.description || item.value || "-");
            htmlTable += `<tr><td><strong>${item.title}</strong></td><td>${infoCell}</td></tr>`;
        });
        htmlTable += `</tbody></table>`;

        if (resultsContainer) {
            resultsContainer.innerHTML = `<h2>${categoryTitleMap[category] || category}</h2>` + htmlTable;
        }
    } catch (e) {
        if (resultsContainer) resultsContainer.innerHTML = "<p>Σφάλμα φόρτωσης δεδομένων.</p>";
    }
}

// --- EVENT LISTENER ΓΙΑ ΤΑ ΠΛΕΥΡΙΚΑ LINKS (API) ---
document.addEventListener('click', function (e) {
    const fetchBtn = e.target.closest('.fetch-link');
    if (fetchBtn) {
        e.preventDefault();
        const type = fetchBtn.getAttribute('data-type');
        const category = fetchBtn.getAttribute('data-category');
        loadDynamicContent(type, category);
    }
});
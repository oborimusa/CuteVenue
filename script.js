// ============================================================
// CuteVenue — Complete JavaScript (Pink Theme)
// ============================================================

// ----- FIREBASE CONFIG -----
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA4of4wK7hje6JRtQtDboZtCkeKmgfVaDE",
    authDomain: "agbonna-638b5.firebaseapp.com",
    projectId: "agbonna-638b5",
    storageBucket: "agbonna-638b5.firebasestorage.app",
    messagingSenderId: "584147461627",
    appId: "1:584147461627:web:5a5a9f51024e0d14b8575e",
    measurementId: "G-W246HC1HLJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("📍 CuteVenue connected to Firebase!");

// ----- DATA -----
let venues = [];
let selectedVenue = null;
let selectedVenueType = 'all';
let bookingData = null;

let selectedAddons = {
    catering: 'none',
    decor: 'none',
    lodging: 'none'
};

const addonPrices = {
    catering: { none: 0, basic: 15000, premium: 25000, luxury: 40000 },
    decor: { none: 0, basic: 10000, premium: 20000, luxury: 35000 },
    lodging: { none: 0, standard: 30000, deluxe: 50000, suite: 80000 }
};

// ----- DOM REFS -----
const steps = document.querySelectorAll('.step');

// ----- INIT -----
document.addEventListener('DOMContentLoaded', async () => {
    await loadVenues();
    renderVenueDropdown();
    renderVenues();
    setMinDate();
});

function setMinDate() {
    const input = document.getElementById('eventDate');
    if (input) {
        const today = new Date().toISOString().split('T')[0];
        input.min = today;
        input.value = today;
    }
}

// ----- LOAD VENUES FROM FIREBASE -----
async function loadVenues() {
    try {
        const querySnapshot = await getDocs(collection(db, "venues"));
        venues = [];
        querySnapshot.forEach((doc) => {
            venues.push({ id: doc.id, ...doc.data() });
        });
        console.log("✅ Venues loaded:", venues);
        return venues;
    } catch (error) {
        console.error("❌ Error loading venues:", error);
        return [];
    }
}

// ----- RENDER VENUE DROPDOWN -----
function renderVenueDropdown() {
    const container = document.getElementById('venueDropdown');
    if (!container) return;

    let html = `<label for="venueSelect">Select a Venue:</label>`;
    html += `<select id="venueSelect" onchange="onVenueChange(this.value)">`;
    html += `<option value="">-- Select a venue --</option>`;

    const filtered = selectedVenueType === 'all' ? venues : venues.filter(v => v.type === selectedVenueType);

    filtered.forEach(venue => {
        html += `<option value="${venue.id}">${venue.name} (${venue.type || 'venue'})</option>`;
    });
    html += `</select>`;
    container.innerHTML = html;
}

function onVenueChange(venueId) {
    if (!venueId) return;
    const venue = venues.find(v => v.id === venueId);
    if (venue) {
        selectVenue(venueId);
    }
}

// ----- VENUE TYPE FILTER -----
function onVenueTypeChange(type) {
    selectedVenueType = type;
    renderVenueDropdown();
    renderVenues();
}

// ----- RENDER VENUES -----
function renderVenues(venuesList = null) {
    const grid = document.getElementById('venueGrid');
    if (!grid) return;

    const data = venuesList || venues;
    const filtered = selectedVenueType === 'all' ? data : data.filter(v => v.type === selectedVenueType);

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="color: #888; text-align: center;">No venues found for this category. Please try another.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(venue => `
        <div class="venue-card" data-id="${venue.id}" onclick="selectVenue('${venue.id}')">
            <span class="icon">${getVenueIcon(venue.type)}</span>
            <h4>${venue.name || "Venue"}</h4>
            <p class="venue-type">${venue.type || 'venue'}</p>
            <p>Capacity: ${venue.capacity || "N/A"} guests</p>
            <p class="price">N${parseInt(venue.price || 0).toLocaleString()}</p>
        </div>
    `).join('');
}

function getVenueIcon(type) {
    const icons = {
        hotel: '🏨',
        event_hall: '🏛️',
        restaurant: '🍽️',
        garden: '🌿',
        lounge: '🛋️',
        conference: '💼',
        wedding: '💒',
        default: '📍'
    };
    return icons[type] || icons.default;
}

// ----- SELECT VENUE -----
function selectVenue(id) {
    const venue = venues.find(v => v.id === id);
    if (!venue) return;

    selectedVenue = venue;

    document.querySelectorAll('.venue-card').forEach(el => {
        el.classList.toggle('selected', el.dataset.id === id);
    });

    document.getElementById('venueSelectedBtn').disabled = false;
    renderSeating();
}

// ----- SEATING LAYOUT -----
function renderSeating() {
    const view = document.getElementById('seatingView');
    if (!view) return;

    if (!selectedVenue) {
        view.innerHTML = '<p style="color: #888;">Select a venue to view details and seating layout.</p>';
        return;
    }

    const cols = 6;
    const total = selectedVenue.capacity || 100;
    const rows = Math.ceil(total / cols);

    let html = `<h4>${selectedVenue.name} — Layout</h4>`;
    html += `<div class="seating-grid" style="grid-template-columns: repeat(${cols}, 1fr);">`;

    for (let i = 0; i < rows * cols; i++) {
        const seatNum = i + 1;
        let status = 'available';
        let label = seatNum;

        if (seatNum > total) {
            status = '';
            label = '—';
        } else if (seatNum % 7 === 0) {
            status = 'occupied';
        } else if (seatNum === 5) {
            status = 'selected-seat';
        }

        html += `<div class="seat ${status}">${label}</div>`;
    }

    html += `</div>`;
    html += `
        <div class="seat-legend">
            <span style="color: #ff6b6b;">●</span> Available
            <span style="color: #f5a623;">●</span> Selected
            <span style="color: #ff4444;">●</span> Occupied
        </div>
    `;

    view.innerHTML = html;
}

// ----- STEP NAVIGATION -----
function goToStep(step) {
    steps.forEach((el, i) => {
        el.classList.toggle('active', i + 1 === step);
    });

    if (step === 3) syncAddonRadios();
    if (step === 4) generateSummary();

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----- ADD-ONS -----
function syncAddonRadios() {
    document.querySelectorAll('.addon-card').forEach(card => {
        const name = card.dataset.addon;
        const value = selectedAddons[name] || 'none';
        const radio = card.querySelector(`input[value="${value}"]`);
        if (radio) radio.checked = true;
    });
}

function toggleAddonDescription(addonType, value) {
    const container = document.getElementById(`${addonType}-description`);
    if (container) {
        container.style.display = value === 'none' ? 'block' : 'none';
    }
}

document.addEventListener('change', (e) => {
    if (e.target.matches('.addon-options input[type="radio"]')) {
        const card = e.target.closest('.addon-card');
        if (card) {
            selectedAddons[card.dataset.addon] = e.target.value;
        }
    }
});

// ----- SUMMARY & INVOICE -----
function generateSummary() {
    const date = document.getElementById('eventDate')?.value || '';
    const eventType = document.getElementById('eventType')?.value || '';

    if (!selectedVenue) {
        document.getElementById('bookingSummary').innerHTML = `
            <p style="color: #ff4444;">⚠️ Please select a venue in Step 2.</p>
        `;
        return;
    }

    const cateringDesc = document.querySelector('#catering-description textarea')?.value || 'None';
    const decorDesc = document.querySelector('#decor-description textarea')?.value || 'None';
    const lodgingDesc = document.querySelector('#lodging-description textarea')?.value || 'None';
    const globalNotes = document.getElementById('globalSpecialRequest')?.value || '';

    const cat = addonPrices.catering[selectedAddons.catering] || 0;
    const dec = addonPrices.decor[selectedAddons.decor] || 0;
    const lod = addonPrices.lodging[selectedAddons.lodging] || 0;

    const venuePrice = parseInt(selectedVenue.price || 0);
    const total = venuePrice + cat + dec + lod;
    const deposit = total * 0.5;

    bookingData = {
        venueId: selectedVenue.id,
        venueName: selectedVenue.name,
        venueType: selectedVenue.type || 'venue',
        date,
        eventType,
        addons: { ...selectedAddons },
        addonDescriptions: { catering: cateringDesc, decor: decorDesc, lodging: lodgingDesc },
        globalNotes,
        total,
        deposit
    };

    const summary = document.getElementById('bookingSummary');
    summary.innerHTML = `
        <h3>📋 Booking Details</h3>
        <p><strong>Venue:</strong> ${selectedVenue.name}</p>
        <p><strong>Type:</strong> ${selectedVenue.type || 'venue'}</p>
        <p><strong>Event:</strong> ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}</p>
        <p><strong>Date:</strong> ${new Date(date).toDateString()}</p>
        <p><strong>Capacity:</strong> ${selectedVenue.capacity || 'N/A'} guests</p>
        <p><strong>Catering:</strong> ${selectedAddons.catering} — N${cat.toLocaleString()}</p>
        ${selectedAddons.catering === 'none' ? `<p style="color: #888; font-size: 0.85rem;"><em>Description: ${cateringDesc}</em></p>` : ''}
        <p><strong>Decor:</strong> ${selectedAddons.decor} — N${dec.toLocaleString()}</p>
        ${selectedAddons.decor === 'none' ? `<p style="color: #888; font-size: 0.85rem;"><em>Description: ${decorDesc}</em></p>` : ''}
        <p><strong>Lodging:</strong> ${selectedAddons.lodging} — N${lod.toLocaleString()}</p>
        ${selectedAddons.lodging === 'none' ? `<p style="color: #888; font-size: 0.85rem;"><em>Description: ${lodgingDesc}</em></p>` : ''}
        ${globalNotes ? `<p><strong>Special Notes:</strong> ${globalNotes}</p>` : ''}
        <hr />
        <p class="total"><strong>Total:</strong> N${total.toLocaleString()}</p>
        <p><strong>Deposit (50%):</strong> N${deposit.toLocaleString()}</p>
    `;

    document.getElementById('totalAmount').textContent = `N${total.toLocaleString()}`;
    document.getElementById('depositAmount').textContent = `N${deposit.toLocaleString()}`;
}

// ----- CONFIRM BOOKING -----
async function confirmBooking() {
    if (!bookingData) {
        alert('Please complete all steps first.');
        return;
    }

    bookingData.guestName = "Guest";

    try {
        const docRef = await addDoc(collection(db, "bookings"), {
            ...bookingData,
            status: "confirmed",
            createdAt: new Date().toISOString()
        });

        const content = document.getElementById('invoiceContent');
        const b = bookingData;

        content.innerHTML = `
            <div style="padding: 20px; border: 1px solid #333; border-radius: 12px;">
                <h3 style="color: #ff6b6b;">📍 CuteVenue — Booking Confirmation</h3>
                <p><strong>Booking ID:</strong> #${docRef.id.slice(0, 8)}</p>
                <p><strong>Venue:</strong> ${b.venueName}</p>
                <p><strong>Type:</strong> ${b.venueType}</p>
                <p><strong>Date:</strong> ${new Date(b.date).toDateString()}</p>
                <p><strong>Event:</strong> ${b.eventType}</p>
                <hr />
                <p style="font-size: 1.2rem;"><strong>Total:</strong> N${b.total.toLocaleString()}</p>
                <p><strong>Deposit Paid:</strong> N${b.deposit.toLocaleString()}</p>
                <p style="color: #888; font-size: 0.85rem;">Balance due on event day: N${(b.total - b.deposit).toLocaleString()}</p>
                ${b.globalNotes ? `<p><strong>Special Notes:</strong> ${b.globalNotes}</p>` : ''}
                <p style="margin-top: 20px; color: #ff6b6b; font-weight: 700;">✅ Booking confirmed! Thank you.</p>
            </div>
        `;

        document.getElementById('invoiceModal').style.display = 'flex';
    } catch (error) {
        console.error("❌ Error saving booking:", error);
        alert('❌ Error saving booking. Please try again.');
    }
}

// ----- MODAL CONTROLS -----
function closeModal() {
    document.getElementById('invoiceModal').style.display = 'none';
}

function printInvoice() {
    window.print();
}

function sendReminder() {
    alert('📧 Reminder sent! (Email service integration required)');
}

// ----- KEYBOARD SHORTCUTS -----
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

// ----- EXPOSE FUNCTIONS TO HTML -----
window.goToStep = goToStep;
window.selectVenue = selectVenue;
window.onVenueChange = onVenueChange;
window.onVenueTypeChange = onVenueTypeChange;
window.confirmBooking = confirmBooking;
window.closeModal = closeModal;
window.printInvoice = printInvoice;
window.sendReminder = sendReminder;
window.toggleAddonDescription = toggleAddonDescription;
window.renderVenues = renderVenues;
window.renderVenueDropdown = renderVenueDropdown;

console.log("📍 CuteVenue loaded successfully!");
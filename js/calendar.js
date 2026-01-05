// Calendar functionality
let currentDate = new Date();

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    renderCalendar(currentDate);
    
    // Add event listeners for navigation buttons
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });
    
    document.getElementById('prevYear').addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() - 1);
        renderCalendar(currentDate);
    });
    
    document.getElementById('nextYear').addEventListener('click', () => {
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        renderCalendar(currentDate);
    });
});

// Render the calendar for a given month
function renderCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Update the current month/year display
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    // Get the first day of the month and the number of days in the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const startDay = firstDay.getDay();
    
    // Create the calendar grid
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyCell);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // Check if this is today
        const today = new Date();
        if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
            dayElement.classList.add('today');
        }
        
        // Format the date for comparison with reservations
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Check if there are appointments for this day
        const appointments = JSON.parse(localStorage.getItem('reservations') || '[]');
        const dayAppointments = appointments.filter(app => app.date === dateStr);
        
        // Add appointments indicator if any exist
        if (dayAppointments.length > 0) {
            dayElement.classList.add('has-appointments');
        }
        
        // Create the day content
        const dayNumber = document.createElement('div');
        dayNumber.className = 'calendar-day-number';
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);
        
        // Add appointment times if any exist
        if (dayAppointments.length > 0) {
            const appointmentsDiv = document.createElement('div');
            appointmentsDiv.className = 'day-appointments';
            
            // Show up to 3 appointment times
            const timesToShow = dayAppointments.slice(0, 3).map(app => app.time);
            appointmentsDiv.textContent = timesToShow.join(', ');
            
            if (dayAppointments.length > 3) {
                appointmentsDiv.textContent += ` +${dayAppointments.length - 3} más`;
            }
            
            dayElement.appendChild(appointmentsDiv);
        }
        
        // Add click event to open booking modal
        dayElement.addEventListener('click', function() {
            showBookingModal(dateStr);
        });
        
        calendarGrid.appendChild(dayElement);
    }
    
    // Update calendar days with appointment information
    updateCalendarDays();
}

// Update calendar days with appointment information
function updateCalendarDays() {
    const calendarDays = document.querySelectorAll('.calendar-day:not(.other-month)');
    const appointments = JSON.parse(localStorage.getItem('reservations') || '[]');
    
    calendarDays.forEach(dayElement => {
        // Get the date from the day number
        const dayNumber = dayElement.querySelector('.calendar-day-number').textContent;
        const monthYear = document.getElementById('currentMonthYear').textContent;
        const monthName = monthYear.split(' ')[0];
        const year = monthYear.split(' ')[1];
        
        // Convert month name to number
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const month = monthNames.indexOf(monthName);
        
        // Format the date string
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`;
        
        // Find appointments for this date
        const dayAppointments = appointments.filter(app => app.date === dateStr);
        
        // Update the day element
        if (dayAppointments.length > 0) {
            dayElement.classList.add('has-appointments');
            
            // Update appointments display
            let appointmentsDiv = dayElement.querySelector('.day-appointments');
            if (!appointmentsDiv) {
                appointmentsDiv = document.createElement('div');
                appointmentsDiv.className = 'day-appointments';
                dayElement.appendChild(appointmentsDiv);
            }
            
            // Show up to 3 appointment times
            const timesToShow = dayAppointments.slice(0, 3).map(app => app.time);
            appointmentsDiv.textContent = timesToShow.join(', ');
            
            if (dayAppointments.length > 3) {
                appointmentsDiv.textContent += ` +${dayAppointments.length - 3} más`;
            }
        } else {
            dayElement.classList.remove('has-appointments');
            const appointmentsDiv = dayElement.querySelector('.day-appointments');
            if (appointmentsDiv) {
                appointmentsDiv.remove();
            }
        }
    });
}

// Function to check if a time slot is available
function isTimeSlotAvailable(date, time) {
    const appointments = JSON.parse(localStorage.getItem('reservations') || '[]');
    const existingAppointment = appointments.find(app => app.date === date && app.time === time);
    return !existingAppointment;
}

// Function to get booked times for a specific date
function getBookedTimesForDate(date) {
    const appointments = JSON.parse(localStorage.getItem('reservations') || '[]');
    return appointments
        .filter(app => app.date === date)
        .map(app => app.time);
}
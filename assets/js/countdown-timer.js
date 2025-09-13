function startCountdown() {
    const hours = 2;
    let endTime = localStorage.getItem('countdownEndTime');
    
    // If no end time is stored or it's expired, create a new one
    if (!endTime || new Date().getTime() > parseInt(endTime)) {
        endTime = new Date().getTime() + (hours * 60 * 60 * 1000);
        localStorage.setItem('countdownEndTime', endTime);
    }
    
    function updateTimer() {
        const now = new Date().getTime();
        const distance = endTime - now;
        
        if (distance < 0) {
            // Reset timer when it expires
            endTime = new Date().getTime() + (hours * 60 * 60 * 1000);
            localStorage.setItem('countdownEndTime', endTime);
            updateTimer();
            return;
        }
        
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        const countdownElement = document.getElementById('countdown');
        if (countdownElement) {
            countdownElement.innerHTML = 
                hours.toString().padStart(2, '0') + ":" +
                minutes.toString().padStart(2, '0') + ":" +
                seconds.toString().padStart(2, '0');
        }
    }
    
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    
    // Clean up interval when page is closed
    window.addEventListener('beforeunload', () => {
        clearInterval(timerInterval);
    });
}

// Start the countdown when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCountdown);
} else {
    startCountdown();
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
    }).catch(() => {
        showToast('Failed to copy');
    });
}

document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('contactName').value;
    const email = document.getElementById('contactEmail').value;
    const message = document.getElementById('contactMessage').value;
    
    // Here you can send the message to your email or save to database
    console.log('Message sent:', { name, email, message });
    
    showToast('Message sent successfully! I will get back to you soon.');
    e.target.reset();
});
// script.js for axzit.github.io

document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  document.getElementById('form-message').textContent = 'Thank you for your message! (Form submission is a placeholder.)';
  this.reset();
});

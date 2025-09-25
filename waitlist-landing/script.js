// Data Gems Minimalistic Waitlist JavaScript

class MinimalWaitlistManager {
  constructor() {
    this.form = document.getElementById('waitlistForm');
    this.submitBtn = document.getElementById('submitBtn');
    this.successMessage = document.getElementById('successMessage');
    this.waitlistCount = document.getElementById('waitlistCount');

    this.init();
  }

  init() {
    if (this.form) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }

    // Update waitlist count from localStorage
    this.updateWaitlistCount();

    // Add subtle form enhancements
    this.addFormEnhancements();
  }

  async handleSubmit(e) {
    e.preventDefault();

    const formData = new FormData(this.form);
    const email = formData.get('email');
    const name = formData.get('name');
    const useCase = formData.get('use-case');

    if (!email) {
      this.showError('Please enter your email address');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.showError('Please enter a valid email address');
      return;
    }

    try {
      this.setLoading(true);
      await this.submitToWaitlist({ email, name, useCase });
      this.showSuccess();
      this.updateWaitlistCount(1);
    } catch (error) {
      console.error('Waitlist submission error:', error);
      this.showError('Something went wrong. Please try again.');
    } finally {
      this.setLoading(false);
    }
  }

  async submitToWaitlist(data) {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Store in localStorage for demo
    const existingEntries = JSON.parse(localStorage.getItem('waitlistEntries') || '[]');
    const entry = {
      ...data,
      timestamp: new Date().toISOString(),
      id: Date.now().toString()
    };

    existingEntries.push(entry);
    localStorage.setItem('waitlistEntries', JSON.stringify(existingEntries));
  }

  setLoading(isLoading) {
    const buttonText = this.submitBtn.querySelector('.button-text');
    const buttonSpinner = this.submitBtn.querySelector('.button-spinner');

    if (isLoading) {
      buttonText.style.display = 'none';
      buttonSpinner.style.display = 'block';
      this.submitBtn.disabled = true;
    } else {
      buttonText.style.display = 'block';
      buttonSpinner.style.display = 'none';
      this.submitBtn.disabled = false;
    }
  }

  showSuccess() {
    this.form.style.opacity = '0';
    this.form.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      this.form.style.display = 'none';
      this.successMessage.style.display = 'block';
    }, 200);
  }

  showError(message) {
    // Create simple error message
    let errorDiv = document.querySelector('.error-message');

    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.cssText = `
        background: #ff4757;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        margin-top: 16px;
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        animation: fadeIn 0.3s ease;
      `;
      this.form.appendChild(errorDiv);
    }

    errorDiv.textContent = message;

    // Remove error after 4 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => errorDiv.remove(), 300);
      }
    }, 4000);
  }

  updateWaitlistCount(increment = 0) {
    const stored = localStorage.getItem('waitlistCount');
    let count = stored ? parseInt(stored) : 542;

    if (increment) {
      count += increment;
      localStorage.setItem('waitlistCount', count.toString());
    }

    if (this.waitlistCount) {
      this.waitlistCount.textContent = `${count}+`;
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  addFormEnhancements() {
    // Add subtle focus effects
    const inputs = this.form.querySelectorAll('.form-input, .form-select');

    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        input.style.transform = 'translateY(-1px)';
      });

      input.addEventListener('blur', () => {
        input.style.transform = 'translateY(0)';
      });
    });
  }
}

// Simple animation utility
class SimpleAnimations {
  static fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';

    setTimeout(() => {
      element.style.transition = `opacity ${duration}ms ease`;
      element.style.opacity = '1';
    }, 10);
  }

  static fadeOut(element, duration = 300) {
    element.style.transition = `opacity ${duration}ms ease`;
    element.style.opacity = '0';

    setTimeout(() => {
      element.style.display = 'none';
    }, duration);
  }
}

// Simple analytics tracking
class SimpleAnalytics {
  static trackEvent(eventName, eventData = {}) {
    console.log('Event:', eventName, eventData);

    // Send to analytics service if available
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, eventData);
    }
  }

  static trackPageView() {
    this.trackEvent('page_view', {
      page_title: document.title,
      page_location: window.location.href
    });
  }

  static trackWaitlistSignup(email, useCase) {
    this.trackEvent('waitlist_signup', {
      email_domain: email.split('@')[1],
      use_case: useCase || 'not_specified'
    });
  }
}

// Add minimal CSS animations
const animationStyles = `
<style>
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
}

.error-message {
  animation: fadeIn 0.3s ease;
}
</style>
`;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add animation styles
  document.head.insertAdjacentHTML('beforeend', animationStyles);

  // Initialize waitlist manager
  new MinimalWaitlistManager();

  // Track page view
  SimpleAnalytics.trackPageView();
});

// Smooth keyboard interaction
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('.form-input')) {
    const form = document.getElementById('waitlistForm');
    if (form) {
      // Move to next input or submit
      const inputs = Array.from(form.querySelectorAll('.form-input, .form-select'));
      const currentIndex = inputs.indexOf(e.target);

      if (currentIndex < inputs.length - 1) {
        e.preventDefault();
        inputs[currentIndex + 1].focus();
      }
    }
  }
});
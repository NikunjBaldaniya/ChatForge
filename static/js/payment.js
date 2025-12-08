// ==================== PAYMENT PAGE LOGIC ====================

// URL Params Logic
const urlParams = new URLSearchParams(window.location.search);
const plan = urlParams.get('plan') || 'monthly';
const price = urlParams.get('price') || '9.99';

document.getElementById('planName').textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
document.getElementById('headerPrice').textContent = price;

let selectedMethod = 'card';
let selectedUpiApp = '';

function setMethod(method) {
    selectedMethod = method;
    
    // UI Toggle
    document.querySelectorAll('.method-option').forEach(el => el.classList.remove('active'));
    const options = ['card', 'upi', 'netbanking', 'wallet'];
    const index = options.indexOf(method);
    document.querySelectorAll('.method-option')[index].classList.add('active');

    // Form Toggle
    document.querySelectorAll('.details-section').forEach(el => el.classList.remove('active'));
    document.getElementById(method + 'Details').classList.add('active');
}

function selectUpiApp(element, app) {
    selectedUpiApp = app;
    document.querySelectorAll('.upi-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

function closeOverlay(id) {
    document.getElementById(id).classList.remove('active');
}

function processPayment() {
    // Validation Logic
    let isValid = false;
    if(selectedMethod === 'card' && document.getElementById('cardNumber').value) isValid = true;
    if(selectedMethod === 'upi' && (document.getElementById('upiId').value || selectedUpiApp)) isValid = true;
    if(selectedMethod === 'netbanking') isValid = true;
    if(selectedMethod === 'wallet' && document.getElementById('walletMobile').value) isValid = true;

    if(!isValid) {
        alert("Please fill in the required details.");
        return;
    }

    // Show Processing
    document.getElementById('processingOverlay').classList.add('active');

    // Simulate API Call
    setTimeout(() => {
        document.getElementById('processingOverlay').classList.remove('active');
        
        // Random Success/Fail
        const isSuccess = Math.random() > 0.1; 
        
        if(isSuccess) {
            document.getElementById('successOverlay').classList.add('active');
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            
            // Upgrade user and redirect
            setTimeout(() => {
                const days = plan === 'monthly' ? 30 : plan === 'quarterly' ? 90 : 365;
                fetch('/api/upgrade-pro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan: plan,
                        days: days,
                        amount: parseFloat(price),
                        payment_method: selectedMethod
                    })
                }).then(res => res.json())
                .then(data => {
                    if (data.success) {
                        sessionStorage.setItem('justUpgraded', 'true');
                        sessionStorage.setItem('newCredits', data.credits);
                        sessionStorage.setItem('newPlan', data.subscription_plan);
                        window.location.href = '/';
                    }
                });
            }, 3000);
        } else {
            document.getElementById('failedOverlay').classList.add('active');
        }
    }, 2500);
}

// Hypergeometric Probability Calculator

// Calculate binomial coefficient C(n, k) using logarithms to avoid overflow
function logFactorial(n) {
    if (n <= 1) return 0;
    let result = 0;
    for (let i = 2; i <= n; i++) {
        result += Math.log(i);
    }
    return result;
}

function binomialCoefficient(n, k) {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;

    // Use logarithms to avoid overflow for large numbers
    const logResult = logFactorial(n) - logFactorial(k) - logFactorial(n - k);
    return Math.round(Math.exp(logResult));
}

// Calculate hypergeometric probability P(X = k)
// N = population size (deck size after turn adjustment)
// K = success states in population (targets)
// n = number of draws (sample size)
// k = number of observed successes
function hypergeometric(N, K, n, k) {
    if (k < 0 || k > Math.min(K, n) || k < Math.max(0, n - (N - K))) {
        return 0;
    }

    const numerator = binomialCoefficient(K, k) * binomialCoefficient(N - K, n - k);
    const denominator = binomialCoefficient(N, n);

    if (denominator === 0) return 0;
    return numerator / denominator;
}

// Format probability as percentage
function formatPercent(value) {
    if (isNaN(value) || !isFinite(value)) return '-';
    return (value * 100).toFixed(2) + '%';
}

// Get color for probability (red=0%, yellow=50%, green=100%)
function getProbabilityColor(probability) {
    // Clamp probability to 0-1
    const p = Math.max(0, Math.min(1, probability));

    let r, g, b;
    if (p < 0.5) {
        // Red to Yellow (0% to 50%)
        const t = p * 2; // 0 to 1
        r = 255;
        g = Math.round(200 * t);
        b = 50;
    } else {
        // Yellow to Green (50% to 100%)
        const t = (p - 0.5) * 2; // 0 to 1
        r = Math.round(255 * (1 - t));
        g = Math.round(200 + 55 * t);
        b = Math.round(50 + 50 * t);
    }

    return `rgb(${r}, ${g}, ${b})`;
}

// Render distribution chart
function renderChart(N, K, n) {
    const chartEl = document.getElementById('chart');
    const labelsEl = document.getElementById('chartLabels');

    // Calculate max possible successes
    const maxK = Math.min(K, n);

    // Calculate all probabilities
    const probabilities = [];
    let maxProb = 0;
    for (let k = 0; k <= maxK; k++) {
        const p = hypergeometric(N, K, n, k);
        probabilities.push(p);
        if (p > maxProb) maxProb = p;
    }

    // Clear existing chart
    chartEl.innerHTML = '';
    labelsEl.innerHTML = '';

    // Render bars
    probabilities.forEach((p, k) => {
        const barContainer = document.createElement('div');
        barContainer.className = 'chart-bar';

        const valueLabel = document.createElement('div');
        valueLabel.className = 'chart-bar-value';
        valueLabel.textContent = (p * 100).toFixed(1) + '%';

        const barFill = document.createElement('div');
        barFill.className = 'chart-bar-fill';
        const heightPercent = maxProb > 0 ? (p / maxProb) * 100 : 0;
        barFill.style.height = heightPercent + '%';
        barFill.style.backgroundColor = getProbabilityColor(p);

        barContainer.appendChild(valueLabel);
        barContainer.appendChild(barFill);
        chartEl.appendChild(barContainer);

        // Add label
        const label = document.createElement('div');
        label.className = 'chart-label';
        label.textContent = k;
        labelsEl.appendChild(label);
    });
}

// Main calculation function
function calculateAll() {
    const errorEl = document.getElementById('error');
    errorEl.classList.remove('visible');
    errorEl.textContent = '';

    // Get input values
    const deckSize = parseInt(document.getElementById('deckSize').value) || 0;
    const turn = parseInt(document.getElementById('turn').value) || 0;
    const sampleSize = parseInt(document.getElementById('sampleSize').value) || 0;
    const targets = parseInt(document.getElementById('targets').value) || 0;

    // Calculate effective deck size (adjusted for turn)
    // SWU draws 2 cards per turn, so we subtract turn*2
    const N = deckSize - turn*2;

    // Update remaining deck display
    document.getElementById('remainingDeck').textContent = N;
    document.getElementById('turnDisplay').textContent = turn;

    // Validation
    const errors = [];
    if (deckSize < 1) errors.push('Deck size must be at least 1');
    if (N < 1) errors.push('Deck size minus turn must be at least 1');
    if (sampleSize > N) errors.push('Sample size cannot exceed remaining deck');
    if (targets > deckSize) errors.push('Targets cannot exceed deck size');
    if (targets > N) errors.push('Targets cannot exceed remaining deck');

    if (errors.length > 0) {
        errorEl.textContent = errors.join('. ');
        errorEl.classList.add('visible');

        // Clear results
        document.getElementById('pWhiff').textContent = '-';
        document.getElementById('pExactlyOne').textContent = '-';
        document.getElementById('pAtLeastOne').textContent = '-';
        document.getElementById('pTwoOrMore').textContent = '-';
        document.getElementById('pWhiffTwice').textContent = '-';

        // Clear chart
        document.getElementById('chart').innerHTML = '';
        document.getElementById('chartLabels').innerHTML = '';
        return;
    }

    // Calculate probabilities
    const pWhiff = hypergeometric(N, targets, sampleSize, 0);
    const pExactlyOne = hypergeometric(N, targets, sampleSize, 1);
    const pAtLeastOne = 1 - pWhiff;

    // P(2 or more) = 1 - P(0) - P(1)
    const pTwoOrMore = 1 - pWhiff - pExactlyOne;

    // P(whiff twice) = P(whiff)^2 (mulligan scenario - independent events)
    const pWhiffTwice = pWhiff * pWhiff;

    // Display results
    document.getElementById('pWhiff').textContent = formatPercent(pWhiff);
    document.getElementById('pExactlyOne').textContent = formatPercent(pExactlyOne);
    document.getElementById('pAtLeastOne').textContent = formatPercent(pAtLeastOne);
    document.getElementById('pTwoOrMore').textContent = formatPercent(pTwoOrMore);
    document.getElementById('pWhiffTwice').textContent = formatPercent(pWhiffTwice);

    // Render distribution chart
    renderChart(N, targets, sampleSize);
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach(input => {
        input.addEventListener('input', calculateAll);
    });

    // Initial calculation
    calculateAll();
});

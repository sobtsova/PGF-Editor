let chartData = [];
let myChart = null;

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    
    if (document.getElementById('manual-page')) {
        renderPointTable();
        updatePreview();
    }
    
    if (document.getElementById('import-page')) {
        updatePreview();
    }
    
    if (document.getElementById('function-page')) {
        calculateFunction(); 
    }
    
    if (document.getElementById('result-page')) {
        generateFinalPGF();
    }
});

// --- ТЕМА ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const icon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        if (icon) {
            icon.className = 'fas fa-sun';
        }
    } else {
        document.body.classList.remove('dark-mode');
        if (icon) {
            icon.className = 'fas fa-moon';
        }
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const icon = document.getElementById('theme-icon');
    
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
        if (icon) {
            icon.className = 'fas fa-sun';
        }
    } else {
        localStorage.setItem('theme', 'light');
        if (icon) {
            icon.className = 'fas fa-moon';
        }
    }
    updatePreview();
}

function toggleModal() {
    document.getElementById('about-modal').classList.toggle('active');
}

// --- МАТЕМАТИЧНІ ФУНКЦІЇ ---
function calculateFunction() {
    const expr = document.getElementById('func-input').value;
    const xMin = parseFloat(document.getElementById('x-min').value);
    const xMax = parseFloat(document.getElementById('x-max').value);
    const step = parseFloat(document.getElementById('step').value);

    if (!expr || isNaN(xMin) || isNaN(xMax) || isNaN(step) || step <= 0) {
        alert('Перевірте правильність введення. Крок має бути більше 0.');
        return;
    }

    // ДОДАНО ПЕРЕВІРКУ: Від не може бути більше До
    if (xMin > xMax) {
        alert('Початкове значення (Від) не може бути більшим за кінцеве (До)!');
        return;
    }

    try {
        chartData = [];
        // Використовуємо цикл for з захистом від нескінченності (на випадок дуже малого кроку)
        let count = 0;
        const maxPoints = 10000; // Ліміт точок для безпеки

        for (let x = xMin; x <= xMax; x += step) {
            if (count++ > maxPoints) {
                alert('Занадто багато точок! Збільшіть крок.');
                break;
            }
            
            let y;
            try {
                if (typeof math !== 'undefined') {
                    y = math.evaluate(expr, { x: x });
                } else {
                    alert('Бібліотека Math.js не завантажена!');
                    return;
                }
            } catch (e) {
                console.error(e);
                return;
            }
            chartData.push({
                x: parseFloat(x.toFixed(2)),
                y: parseFloat(y.toFixed(2))
            });
        }
        updatePreview();
    } catch (e) {
        alert('Помилка у формулі: ' + e.message);
    }
}

// --- ЗАВАНТАЖЕННЯ ФУНКЦІЇ ---
function handleFunctionFileUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const config = JSON.parse(e.target.result);
            const funcInput = document.getElementById('func-input');
            const xMin = document.getElementById('x-min');
            const xMax = document.getElementById('x-max');
            const step = document.getElementById('step');

            if (funcInput && config.formula) {
                funcInput.value = config.formula;
            }
            if (xMin && config.xMin !== undefined) {
                xMin.value = config.xMin;
            }
            if (xMax && config.xMax !== undefined) {
                xMax.value = config.xMax;
            }
            if (step && config.step !== undefined) {
                step.value = config.step;
            }
            
            calculateFunction(); 
            alert('Функцію успішно завантажено!');
        } catch (err) {
            console.error(err);
            alert('Помилка читання JSON файлу.');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

// --- РУЧНЕ ВВЕДЕННЯ ---
function addPoint() {
    const xIn = document.getElementById('input-x');
    const yIn = document.getElementById('input-y');
    const x = parseFloat(xIn.value);
    const y = parseFloat(yIn.value);
    
    if (isNaN(x) || isNaN(y)) {
        alert('Введіть коректні числа');
        return;
    }
    
    chartData.push({ x, y });
    chartData.sort((a, b) => a.x - b.x);
    
    xIn.value = '';
    yIn.value = '';
    
    renderPointTable();
    updatePreview();
}

function removePoint(index) {
    chartData.splice(index, 1);
    renderPointTable();
    updatePreview();
}

function renderPointTable() {
    const tbody = document.getElementById('points-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (chartData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-table-row">Дані відсутні</td></tr>`;
        return;
    }
    
    chartData.forEach((p, i) => {
        tbody.innerHTML += `<tr><td>${p.x}</td><td>${p.y}</td><td><button onclick="removePoint(${i})" class="btn-icon remove-btn-icon"><i class="fas fa-times"></i></button></td></tr>`;
    });
}

function clearData() {
    chartData = [];
    renderPointTable();
    updatePreview();
}

// --- ІМПОРТ ---
function handleFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    document.getElementById('file-name').textContent = file.name;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            if (file.name.endsWith('.json')) {
                chartData = JSON.parse(text);
            } else {
                chartData = text.split('\n')
                    .map(l => l.split(','))
                    .filter(p => p.length >= 2)
                    .map(p => ({
                        x: parseFloat(p[0]),
                        y: parseFloat(p[1])
                    }))
                    .filter(p => !isNaN(p.x));
            }
            
            const container = document.getElementById('import-table-container');
            if (container) {
                let html = '<table class="data-table"><thead><tr><th>X</th><th>Y</th></tr></thead><tbody>';
                chartData.slice(0, 100).forEach(p => {
                    html += `<tr><td>${p.x}</td><td>${p.y}</td></tr>`;
                });
                html += '</tbody></table>';
                container.innerHTML = html;
            }
            updatePreview();
        } catch {
            alert('Помилка файлу');
        }
    };
    reader.readAsText(file);
}

// --- ПРЕВ'Ю ---
function updatePreview() {
    const canvas = document.getElementById('previewCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Адаптивні кольори
    const isDark = document.body.classList.contains('dark-mode');
    const txtColor = isDark ? '#f1f5f9' : '#1e293b'; 
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const fontFamily = "'Segoe UI', sans-serif"; 

    const title = getValue('chart-title', 'Графік');
    const type = getValue('chart-type', 'line');
    const color = getValue('chart-color', '#10b981');
    const axisX = getValue('axis-x', 'X');
    const axisY = getValue('axis-y', 'Y');
    const showGrid = getValue('grid-type', 'major') !== 'none';
    const thickness = getValue('line-thickness', 'normal');
    
    let borderWidth = 2;
    if (thickness === 'thin') {
        borderWidth = 1;
    }
    if (thickness === 'thick') {
        borderWidth = 4;
    }

    const jsType = type === 'bar' ? 'bar' : (type === 'scatter' ? 'scatter' : 'line');

    if (myChart) {
        myChart.destroy();
    }

    Chart.defaults.font.family = fontFamily;
    Chart.defaults.color = txtColor;

    myChart = new Chart(ctx, {
        type: jsType,
        data: {
            labels: chartData.map(p => p.x),
            datasets: [{
                label: axisY,
                data: chartData.map(p => ({ x: p.x, y: p.y })),
                borderColor: color,
                backgroundColor: color + '80',
                borderWidth: borderWidth,
                pointBackgroundColor: color,
                pointRadius: type === 'scatter' ? 5 : 3,
                showLine: type !== 'scatter',
                borderDash: getValue('line-style', 'solid') === 'dashed' ? [5, 5] : (getValue('line-style') === 'dotted' ? [2, 2] : [])
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: title,
                    color: txtColor,
                    font: { size: 16, family: fontFamily, weight: 'bold' }
                },
                legend: {
                    display: false
                }
            },
            scales: {
                x: { 
                    type: 'linear',
                    title: {
                        display: true,
                        text: axisX,
                        color: txtColor,
                        font: { size: 14, family: fontFamily }
                    }, 
                    ticks: {
                        color: txtColor,
                        font: { family: fontFamily }
                    }, 
                    grid: {
                        display: showGrid,
                        color: gridColor
                    } 
                },
                y: { 
                    title: {
                        display: true,
                        text: axisY,
                        color: txtColor,
                        font: { size: 14, family: fontFamily }
                    }, 
                    ticks: {
                        color: txtColor,
                        font: { family: fontFamily }
                    }, 
                    grid: {
                        display: showGrid,
                        color: gridColor
                    } 
                }
            },
            layout: {
                padding: 10
            }
        }
    });
}

function getValue(id, def) {
    const el = document.getElementById(id);
    return el ? el.value : def;
}

// --- ГЕНЕРАЦІЯ ---
function submitGeneration() {
    if (chartData.length === 0) {
        alert('Додайте дані!');
        return;
    }
    
    const settings = {
        title: getValue('chart-title', 'Графік'),
        axisX: getValue('axis-x', 'X'),
        axisY: getValue('axis-y', 'Y'),
        type: getValue('chart-type', 'line'),
        style: getValue('line-style', 'solid'),
        color: getValue('chart-color', 'blue'),
        grid: getValue('grid-type', 'major'),
        thickness: getValue('line-thickness', 'normal'),
        legendLabel: getValue('legend-label', ''),
        legendPos: getValue('legend-pos', 'north east'),
        data: chartData
    };
    
    localStorage.setItem('pgfSettings', JSON.stringify(settings));
    window.location.href = 'result.html';
}

async function generateFinalPGF() {
    const settings = JSON.parse(localStorage.getItem('pgfSettings'));
    if (!settings) return;
    
    const output = document.getElementById('pgf-output');
    output.value = '% Генерація...';
    
    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
        const result = await res.json();
        
        if (result.success) {
            output.value = result.pgf;
        } else {
            output.value = '% Помилка: ' + result.error;
        }
    } catch {
        output.value = '% Помилка сервера';
    }
}

function copyToClipboard() {
    document.getElementById('pgf-output').select();
    document.execCommand('copy');
    alert('Код скопійовано');
}

function downloadPGF() {
    const content = document.getElementById('pgf-output').value;
    
    const nameInput = document.getElementById('filename-input');
    let fileName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : 'chart';
    
    if (!fileName.endsWith('.pgf')) {
        fileName += '.pgf';
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

function loadPGFCode(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('pgf-output').value = e.target.result;
    };
    reader.readAsText(file);
}
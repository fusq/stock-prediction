<template>
    <div class="w-full h-64 border border-gray-300 rounded-md shadow p-4">
        <canvas ref="chartCanvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
    historicalData: Array,
    predictedData: Array,
    primaryLabel: String,
    secondaryLabel: String,
    chartType: {
        type: String,
        validator: (value) => ['stock', 'currency'].includes(value)
    }
});

const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
    if (chart) {
        chart.destroy();
    }

    const combinedPredictedData = [props.historicalData[props.historicalData.length - 1], ...props.predictedData];

    const ctx = chartCanvas.value.getContext('2d');
    const last40Days = props.historicalData.slice(-40);
    const labels = [...Array(50).keys()].map(i => i + 1);

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Historical',
                    data: last40Days,
                    borderColor: '#374151',
                    fill: false,
                    pointRadius: 0
                },
                {
                    label: 'Predicted',
                    data: [...Array(39).fill(null), ...combinedPredictedData],
                    borderColor: '#EF4444',
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: getChartTitle(),
                    font: {
                        size: 14 // Adjusted the font size to make the title smaller
                    }
                },
                tooltip: {
                    enabled: true,
                    mode: 'nearest',
                    intersect: false,
                    backgroundColor: '#000000',
                    titleColor: '#000000',
                    bodyColor: '#FFFFFF',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    cornerRadius: 4,
                    shadowOffsetX: 0,
                    shadowOffsetY: 2,
                    shadowBlur: 4,
                    shadowColor: 'rgba(0, 0, 0, 0.1)',
                    callbacks: {
                        title: function () {
                            return ''; // Return an empty string to hide the title
                        },
                        label: function (context) {
                            let label = '';
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                            }
                            return label;
                        },
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: false
                    },
                    ticks: {
                        display: true,
                        maxTicksLimit: 15 // Adjust this value to control the number of ticks
                    },
                    grid: {
                        color: '#f3f4f6'
                    }
                },
                y: {
                    title: {
                        display: false
                    },
                    ticks: {
                        display: true,
                        maxTicksLimit: 7 // Adjust this value to control the number of ticks
                    },
                    grid: {
                        color: '#f3f4f6'
                    }
                },
            }
        }
    });
};

const getChartTitle = () => {
    if (props.chartType === 'stock') {
        return `${props.primaryLabel} Price Prediction`;
    } else if (props.chartType === 'currency') {
        return `${props.primaryLabel}/${props.secondaryLabel} Exchange Rate Prediction`;
    }
    return 'Prediction Chart';
};

onMounted(() => {
    if (props.historicalData.length > 0 && props.predictedData.length > 0) {
        createChart();
    }
});

watch([() => props.historicalData, () => props.predictedData], () => {
    if (props.historicalData.length > 0 && props.predictedData.length > 0) {
        createChart();
    }
});
</script>
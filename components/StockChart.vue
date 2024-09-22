<template>
    <div class="w-full h-64 border border-gray-300 rounded-md p-4">
        <canvas ref="chartCanvas"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

const props = defineProps({
    historicalData: Array,
    predictedData: Array,
    symbol: String
});

const chartCanvas = ref(null);
let chart = null;

const createChart = () => {
    if (chart) {
        chart.destroy();
    }

    const combinedPredictedData = [props.historicalData[props.historicalData.length - 1], ...props.predictedData];

    const ctx = chartCanvas.value.getContext('2d');
    const last30Days = props.historicalData.slice(-40);
    const labels = [...Array(50).keys()].map(i => i + 1);

    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Historical',
                    data: last30Days,
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
                    text: `${props.symbol} Price Prediction`,
                    font: {
                        size: 16
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: false
                    },
                    ticks: {
                        display: false
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: false
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
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
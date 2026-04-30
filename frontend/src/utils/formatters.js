export const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0,00';
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(num);
};

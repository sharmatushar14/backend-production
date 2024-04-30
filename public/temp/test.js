async function fetchDataAndProcess() {
    try {
        // Asynchronously fetch data from an API
        const data = await fetch('https://api.example.com/data');
        
        // While waiting for the data to be fetched, the JavaScript engine can respond to user interactions
        document.getElementById('loading-message').innerText = 'Fetching data...';

        // Perform some computations on the fetched data (e.g., filter, map, reduce)
        const processedData = processData(await data.json());
        
        // Update the UI with the processed data
        renderData(processedData);
        
        // Continue with other tasks
        console.log('Other tasks can continue while waiting for data to be fetched and processed.');
    } catch (error) {
        console.error('Error fetching or processing data:', error);
    }
}

function processData(data) {
    // Perform computations on the fetched data
    return data.map(item => item.name);
}

function renderData(data) {
    // Update the UI with the processed data
    document.getElementById('data-list').innerHTML = data.map(item => `<li>${item}</li>`).join('');
}

// Call the fetchDataAndProcess function when the page loads
window.addEventListener('load', fetchDataAndProcess);

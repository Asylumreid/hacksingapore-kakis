const fs = require('fs');
const readlineSync = require('readline-sync');
const csv = require('csv-parser');

// Function to read CSV file and return its content as an array of objects
async function readCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath) // Create a readable stream from the CSV file
            .pipe(csv()) // Pipe the stream through the CSV parser
            .on('data', (data) => results.push(data)) // On each data event, push the data into the results array
            .on('end', () => resolve(results)) // When the stream ends, resolve the promise with the results
            .on('error', (err) => reject(err)); // On error, reject the promise with the error
    });
}

// Function to calculate bus fare based on bus number, start, and end stops
async function calculateBusFare(busNum, start, end) {
    const fare = await readCSV('transformed_fare_2023.csv'); // Read fare CSV file
    const routes = await readCSV('bus_routes_2023.csv'); // Read bus routes CSV file

    let distance = 0;
    // Filter routes to get the specific bus route
    const busRoute = routes.filter(r => r.ServiceNo === busNum);

    // Calculate the distance traveled
    for (const busstop of busRoute) {
        if (parseInt(busstop.BusStopCode) === start) {
            distance -= parseFloat(busstop.Distance); // Subtract distance when start stop is found
        } else if (parseInt(busstop.BusStopCode) === end) {
            distance += parseFloat(busstop.Distance); // Add distance when end stop is found
        }
    }

    distance = Math.abs(distance); // Get absolute value of the distance
    console.log(`Distance travelled: ${distance.toFixed(1)}km`);

    // Find the fare based on the calculated distance and conditions
    const fareToPay = fare.find(f => 
        f.applicable_time === 'All other timings' && 
        f.fare_type === 'Adult card fare' && 
        parseFloat(f.Min) <= distance && 
        parseFloat(f.Max) >= distance
    );

    if (fareToPay) {
        const fareValue = parseInt(fareToPay.fare_per_ride, 10); // Parse fare to integer
        const formattedFare = `$${(fareValue / 100).toFixed(2)}`; // Format fare as dollars
        return formattedFare;
    } else {
        return 'Fare not found'; // Return a message if no fare is found
    }
}

// Function to calculate MRT fare based on start and end stations
async function calculateMrtFare(start, end) {
    const fare = await readCSV('transformed_fare_2023.csv'); // Read fare CSV file
    const routes = await readCSV('mrt_routes_2023.csv'); // Read MRT routes CSV file

    let distance = 0;
    let line;

    // Determine the MRT line based on start and end stations
    if (start.slice(0, 2) === end.slice(0, 2) || (start !== 'PTC' && start !== 'STC')) {
        line = start.slice(0, 2);
    } else {
        line = end.slice(0, 2);
    }

    // Filter routes to get the specific MRT line
    const mrtRoute = routes.filter(r => r.stationLine === line);

    // Calculate the distance traveled
    mrtRoute.forEach(mrtstop => {
        if (mrtstop.stationId === start) {
            distance -= parseFloat(mrtstop.Distance); // Subtract distance when start station is found
        } else if (mrtstop.stationId === end) {
            distance += parseFloat(mrtstop.Distance); // Add distance when end station is found
        }
    });

    distance = Math.abs(distance); // Get absolute value of the distance
    console.log(`Distance travelled: ${distance.toFixed(1)}km`);

    // Find the fare based on the calculated distance and conditions
    const fareToPay = fare.find(f => 
        f.applicable_time === 'All other timings' && 
        f.fare_type === 'Adult card fare' && 
        parseFloat(f.Min) <= distance && 
        parseFloat(f.Max) >= distance
    );

    return fareToPay ? `$${(parseInt(fareToPay.fare_per_ride, 10) / 100).toFixed(2)}` : 'Fare not found';
}

// Main function to execute fare calculation
async function main() {
    // Uncomment the following lines if you want to calculate bus fare
    // const busNum = readlineSync.question('Enter bus service number: ');
    // const start = parseInt(readlineSync.question('Enter boarding busstop: '));
    // const end = parseInt(readlineSync.question('Enter alighting busstop: '));
    // const fare = await calculateBusFare(busNum, start, end);

    // Read input for MRT fare calculation
    const start = readlineSync.question('Enter boarding MRT station: '); // User input for start station (should be in CAPS)
    const end = readlineSync.question('Enter alighting MRT station: '); // User input for end station (should be in CAPS)
    const fare = await calculateMrtFare(start.toUpperCase(), end.toUpperCase()); // Convert input to uppercase and calculate fare

    console.log('Fare:', fare); // Output the calculated fare
}

main(); // Execute the main function

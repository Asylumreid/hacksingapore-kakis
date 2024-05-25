const fs = require('fs');
const readlineSync = require('readline-sync');
const csv = require('csv-parser');

async function readCSV(filePath) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

async function calculateFare(busNum, start, end) {
    const fare = await readCSV('transformed_fare_2023.csv');
    const routes = await readCSV('bus_routes_2023.csv');

    let distance = 0;
    const busRoute = routes.filter(r => r.ServiceNo === busNum);

    for (const busstop of busRoute) {
        if (parseInt(busstop.BusStopCode) === start) {
            distance -= parseFloat(busstop.Distance);
        } else if (parseInt(busstop.BusStopCode) === end) {
            distance += parseFloat(busstop.Distance);
        }
    }

    distance = Math.abs(distance);
    console.log(`Distance travelled: ${distance.toFixed(1)}km`);

    const fareToPay = fare.find(f => 
        f.applicable_time === 'All other timings' && 
        f.fare_type === 'Adult card fare' && 
        parseFloat(f.Min) <= distance && 
        parseFloat(f.Max) >= distance
    );

    if (fareToPay) {
        const fareValue = parseInt(fareToPay.fare_per_ride, 10);
        const formattedFare = `$${(fareValue / 100).toFixed(2)}`;
        return formattedFare;
    } else {
        return 'Fare not found';
    }
}

async function main() {
    const busNum = readlineSync.question('Enter bus service number: ');
    const start = parseInt(readlineSync.question('Enter boarding busstop: '));
    const end = parseInt(readlineSync.question('Enter alighting busstop: '));

    const fare = await calculateFare(busNum, start, end);
    console.log('Fare:', fare);
}

main();

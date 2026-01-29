import pkg from "indian-states-cities-list";
const { STATE_WISE_CITIES, STATES_OBJECT } = pkg;

const stateName = "TamilNadu"; // Key from STATES_OBJECT.name
const data = STATE_WISE_CITIES[stateName];

console.log(`Data for ${stateName} (Count: ${data?.length}):`);

if (data && data.length > 0) {
    const first = data[0];
    console.log("First item structure:", JSON.stringify(first, null, 2));

    const chennai = data.filter(c => c.district === "Chennai");
    console.log(`Cities in Chennai district: ${chennai.length}`);

    if (chennai.length > 0) {
        console.log("Sample Chennai City:", JSON.stringify(chennai[0], null, 2));
    } else {
        console.log("No cities match district 'Chennai'. Dumping unique districts from data:");
        const districts = new Set(data.map(d => d.district));
        console.log(Array.from(districts).slice(0, 10));
    }
}

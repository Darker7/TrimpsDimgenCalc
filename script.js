const recalculate = function () {
	
	//Original code written in C by /u/Darker7
	//Original code: https://pastebin.com/5fxgNb6z
	//Original post: https://old.reddit.com/r/Trimps/comments/9ep5u2/how_to_fuel_most_efficiently/
	
	//Ported to JavaScript, cleaned up and docummented by /u/PatPL
	
	//====
	// Output objects setup
	
	const outputMinObject = document.getElementById ("minZoneOutput");
	const outputMaxObject = document.getElementById ("maxZoneOutput");
	const outputSliderPercentObject = document.getElementById ("sliderAdjustmentPercent");
	const outputSliderTapsObject = document.getElementById ("sliderAdjustmentTaps");
	
	//====
	// Input validation & parsing
	
	let supplyLevel = document.getElementById ("supplyInput");
	let capacityLevel = document.getElementById ("capacityInput");
	let fuellingZones = document.getElementById ("fuellingInput");
	let fuellingLimit = document.getElementById ("limitInput");
	
	//Checks whether input value passed HTML validation (is a number and is not empty)
	if (!supplyLevel.checkValidity () || !capacityLevel.checkValidity () || !fuellingZones.checkValidity () || !fuellingLimit.checkValidity ()) {
		outputMinObject.innerHTML = "Invalid";
		outputMaxObject.innerHTML = "Input";
		
		return;
	}
	
	//Parsing into int
	supplyLevel = parseInt (supplyLevel.value);
	capacityLevel = parseInt (capacityLevel.value);
	fuellingZones = parseInt (fuellingZones.value);
	fuellingLimit = parseInt (fuellingLimit.value);
	
	//====
	// Tauntimp bonus
	
	//Data as of Trimps v4.91
	const singleTauntimpMultiplier = 1.003;
	const tauntimpSpawnChance = 0.03;
	
	//I believe that cell 100 (blimp/Improbability etc.) can never be an import, so i'll exclude it
	const averageTauntimpsPerZone = tauntimpSpawnChance * 99;
	
	const baseTauntimpMultiplier = singleTauntimpMultiplier ** averageTauntimpsPerZone;
	
	//====
	// Main calculations
	
	let maxSupplyOffset = supplyLevel * 2; //How many zones into magma do we gain fuel per magma cell
	let maxSupplyZone = 230 + maxSupplyOffset; //Up to which world zone do we gain fuel per magma cell
	//Fuel variables are multiplied by 100 to stay in integers. Value 20 in variable means 0.2 units of Fuel
	let maxFuelPerCell = 20 + maxSupplyOffset; //Maximum possible fuel gain per magma cell
	let currentFuelPerCell = maxFuelPerCell - 1; //"Current" fuel gain per magma cell (It decreases by 1 later on every while loop iteration)
	let FuelPerCellCapcalc = 0; //"Current" fuel gain per magma cell in the storage reduction calculation
	let Tauntbonus_add = 1.0; //Tauntimpbonus for the next zone to be added
	let Tauntbonus_subtract = 1.0; //Tauntimpbonus for the next zone to be subtracted
			//The fueling window is shifted downwards each iteration
	let Tauntbonus_capcal = 1.0; //Internal value for the storage reduction Tauntbonus calculation
	let storage = 300 + 40 * capacityLevel; //Size of the DimGen's storage for storage reduction calculation
	let slider_adjustment = storage / 100; //Precision of storage adjustments (1% of max storage)
	let fill = 0; //How far the DG is currently filled up
	let storage_bonus = 1.0; //Population bonus provided by current storage limit 
	let n = 0 // How many zones before maxSupplyZone do we want to start fuelling
	let sum_new = 0; //Fuel gained adjusted for Tauntimps
	let sum_old = 0;
	let pop_new = 0; //Fuel gained adjusted for Tauntimps and storage (Used in storage reduction calculation)
	let pop_old = 0;
	let sliderposition = -2; //How far the slider is currently offset (1% steps) (initialized to -2 to account for initialization loop and last loop)
	
	//initializes optimal zones calculation
	//by starting counting up from the zone at which you reach max supply drops
	//(because starting later than that guarantees diminished returns)
	for (let i = 0; i < fuellingZones; ++i) {
		sum_new += maxFuelPerCell * Tauntbonus_add;
		Tauntbonus_add *= baseTauntimpMultiplier;
	}
	
	//Shifts the window of zones considered for fuelling down by one
	//This assumes that values are constant for any given zone,
	//so it simply subtracts the value of the highest zone and adds the value of the lowest zone, omitting recalculation of the zones inbetween
	while (sum_new > sum_old) {
		sum_old = sum_new;
		
		sum_new = sum_new - (maxFuelPerCell * Tauntbonus_subtract) + (currentFuelPerCell * Tauntbonus_add);
		
		--currentFuelPerCell;
		Tauntbonus_add *= baseTauntimpMultiplier;
		Tauntbonus_subtract *= baseTauntimpMultiplier;
		
		++n;
		
		if (n > fuellingZones) {
			--maxFuelPerCell;
		}
		
		
		if (n > maxSupplyOffset) {
			break;
		}
	}
	//set values back to reflect the current state affairs
	++currentFuelPerCell; 
	Tauntbonus_add /= baseTauntimpMultiplier;
	Tauntbonus_subtract /= baseTauntimpMultiplier; //(this one is never accessed again)
	--n;

	//checks offset viability
	if (n == maxSupplyOffset);
	else if (fuellingZones > fuellingLimit - 230) {
		n = maxSupplyOffset;
	} else if (maxSupplyZone - n + fuellingZones > fuellingLimit) {
		n = -fuellingLimit + fuellingZones + maxSupplyZone;
	}

	//Only important when fuelling for few zones with high capacity
	//Calculates the amount of fuel used by overclocks and considers the rest as lost
	//Also takes Tauntimps into account
	do {
		pop_old = pop_new;
		Tauntbonus_capcal = Tauntbonus_add;
		FuelPerCellCapcalc = currentFuelPerCell;
		storage_bonus = Math.sqrt(0.01 * storage);
		pop_new = 0.0;
		fill = 0;

		for (let j = 0; j < fuellingZones; ++j) { //iterates over every zone
			for (let k = 0; k < 18; k++) { //iterates over every magma cell
				if (fill < storage * 2) //storage*2 because the storage update doubles your storage
					fill += FuelPerCellCapcalc;
				else pop_new += FuelPerCellCapcalc * Tauntbonus_capcal * storage_bonus;
			}
			Tauntbonus_capcal /= baseTauntimpMultiplier;
			FuelPerCellCapcalc;
		}

		++sliderposition;
		storage -= slider_adjustment;
		if (storage <= 0) break; //safety precaution
	} while (pop_new >= pop_old)
	
	outputMinObject.innerHTML = maxSupplyZone - n;
	outputMaxObject.innerHTML = maxSupplyZone - n + fuellingZones;
	outputSliderPercentObject.innerHTML = 100 - sliderposition;
	outputSliderTapsObject.innerHTML = sliderposition;
	
	return;
}
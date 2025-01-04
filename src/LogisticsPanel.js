import {useContext} from 'react';
import * as Constants from './Constants';
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CancelIcon from '@mui/icons-material/Cancel';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Carrier from './Carrier';
import {OrdersContext} from './OrdersContext';

function createCarrierMap(empireShipsInSector, loadOrders, unloadOrders) {
// create a map of carriers to cargo data for that carrier,
// cargo data includes all existing and possible cargo, carrier rack status,etc. -- basically anything
// needed to display the current load status of that carrier and its cargo

    console.log("Called create Carrier map");
//    console.log("load orders = " + JSON.stringify(Array.from(loadOrders.entries())));
    const carrierMap = new Map();

    if (!empireShipsInSector) {
        return carrierMap;
    }

    var allPendingCargoLoads = new Set();
    var allPendingCargoUnloads = new Set();
    [...loadOrders.values()].forEach(list => list.forEach(ship => allPendingCargoLoads.add(ship)));
    [...unloadOrders.values()].forEach(list => list.forEach(ship => allPendingCargoUnloads.add(ship)));
//    console.log(" all pending load cargos " + JSON.stringify(Array.from(allPendingCargoLoads.values())));
//    console.log(" all pending unload  cargos " + JSON.stringify(Array.from(allPendingCargoUnloads.values())));

    // find all carriers in sector
    const carriers = Object.values(empireShipsInSector).filter(ship => ship.racks > 0);
    for (const i in carriers) {
        const carrier = carriers[i];
//             console.log("carrier = " + JSON.stringify(carrier));

        // get a list of original cargo already loaded onto that carrier
        const originalCargo = carrier.cargo ? carrier.cargo.map(name => empireShipsInSector[name]) : [];
//             console.log("cargoList " + JSON.stringify(originalCargo));

        // compute loaded tonnage and free racks for this carrier based on existing cargo
        var loadedTonnage = 0;
        originalCargo.map(cargo => { loadedTonnage += cargo.tonnage});
        var pendingLoads = loadOrders.get(carrier) || [];
        pendingLoads.map(ship => { loadedTonnage += ship.tonnage});
        var pendingUnloads = unloadOrders.get(carrier) || [];
        pendingUnloads.map(ship => { loadedTonnage -= ship.tonnage});
//        console.log("loaded tonnage pending unloads " + loadedTonnage);

        const freeRacks = carrier.racks - loadedTonnage;
//        console.log("free racks " + freeRacks);


//        console.log("empire ships in sector " + JSON.stringify(empireShipsInSector));
        // find ships in sector that could possibly be loadable new cargo
        const loadableShips = Object.values(empireShipsInSector)
                      .filter(ship => ship.tonnage <= freeRacks) // ship fits in free racks
                      .filter(ship => !ship.carrier || allPendingCargoUnloads.has(ship)) // ship is not loaded cargo or has pending unload
                      .filter(ship => !allPendingCargoLoads.has(ship)) // no pending load order for ship
                      //TODO remove anything already pending load
                      .filter(ship => (ship.racks || 0) == 0) // ship is not a carrier (no racks)
                      .sort((a, b) => a.name.localeCompare(b.name));
//        console.log("loadable ships " + JSON.stringify(loadableShips));

        const loadsWithoutUnloads =  // pending load of original cargo without matching unload
              pendingLoads.filter(ship => ship.carrier && !allPendingCargoUnloads.has(ship));
        // build a map of carrier to data object containing all existing and possible cargo
        const data = { loadedTonnage: loadedTonnage,
                       freeRacks: freeRacks,
                       originalCargo: originalCargo,
                       pendingLoads: pendingLoads,
                       loadsWithoutUnloads: loadsWithoutUnloads,
                       pendingUnloads: pendingUnloads,
                       loadableShips: loadableShips };
        carrierMap.set(carrier, data);

//        console.log("carrierMap = " + JSON.stringify(Array.from(carrierMap.values())));
    }
    return carrierMap;
}

export default function LogisticsPanel(props) {
    console.log("Called LogisticsPanel");
    const carriers = [];
    const sectorData = props.sectorData;
    const turnData = props.turnData;

    const { loadOrders, addLoadOrder, deleteLoadOrder,
            unloadOrders, addUnloadOrder, deleteUnloadOrder } = useContext(OrdersContext);

    var carrierMap = new Map();
    if (sectorData && sectorData.ships) {
//        console.log("ships = " + JSON.stringify(sectorData.ships));
        const empireInSector = sectorData.ships[turnData.name];
//        console.log("turnData = " + turnData.name);
//        console.log("empireInSector = " + JSON.stringify(empireInSector));
        if (empireInSector) {
            const empireShipsInSector = empireInSector.ships;
            carrierMap = createCarrierMap(empireShipsInSector, loadOrders, unloadOrders);
        }
    }
//    loadOrders.forEach((value, key) => value.forEach(cargo => console.log("load " + cargo.name + " onto " + key.name)));
//    unloadOrders.forEach((value, key) => value.forEach(cargo => console.log("unload " + cargo.name + " from " + key.name)));

    function handleCancelLoadShip(cargo, carrier) {
        deleteLoadOrder(cargo, carrier);
    }
    function handleCancelUnloadShip(cargo, carrier) {
        deleteUnloadOrder(cargo, carrier);
    }

    function handleLoadShip(cargo, carrier) {
         addLoadOrder(cargo, carrier);
    }

    function handleUnloadShip(cargo, carrier) {
         addUnloadOrder(cargo, carrier);
    }

    // create a Carrier widget for each carrier in sector
    carrierMap.forEach((carrierData, carrier) => {
                      console.log("key = " + JSON.stringify(carrier));
                      console.log("value = " + JSON.stringify(carrierData));
//console.log("carrier data " + JSON.stringify(carrierData));
          carriers.push(<Carrier key={carrier.name} carrier={carrier} carrierData={carrierData}
                                 handleLoadShip={handleLoadShip}
                                 handleUnloadShip={handleUnloadShip}
                                 handleCancelLoadShip={handleCancelLoadShip}
                                 handleCancelUnloadShip={handleCancelUnloadShip}
                        />);
          });

    return (
    <>
          {carriers}
    </>
    );
}

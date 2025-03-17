import React from 'react';
import * as Constants from './Constants';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Cargo from './Cargo';
import Stack from '@mui/material/Stack';
import LoadNewShip from './LoadNewShip';
import Tooltip from '@mui/material/Tooltip';

export default function Carrier(props) {
    const carrier = props.carrier;
    const carrierData = props.carrierData;
//    console.log("carrierData = " + JSON.stringify(carrierData));
    const loadedTonnage = carrierData.loadedTonnage;
    const overloadedIcon = carrierData.freeRacks < 0 ? <Tooltip title="Rack count exceeded"><WarningAmberIcon /></Tooltip> : null;
    const pendingUnloads = carrierData.pendingUnloads;
    const pendingLoads = carrierData.pendingLoads;
    const loadsWithoutUnloads = carrierData.loadsWithoutUnloads;

    const cargoItems = [];
    const originalCargo = carrierData.originalCargo;
    var i;
    for (i = 0; i < originalCargo.length; i++) {
         const cargo = originalCargo[i];
    //             console.log("stack Found cargo " + ship);
         cargoItems.push(<Cargo key={cargo.name} carrier={carrier} cargo={cargo}
                                hasOrder={pendingUnloads.includes(cargo) ? Constants.ORDER_TYPE.Unload : null}
                                handleCancelLoadShip={props.handleCancelLoadShip}
                                handleCancelUnloadShip={props.handleCancelUnloadShip}
                                handleUnloadShip={props.handleUnloadShip} />);
    }
    for (i = 0; i < pendingLoads.length; i++) {
         const cargo = pendingLoads[i];
         cargoItems.push(<Cargo key={cargo.name} carrier={carrier} cargo={cargo}
                                hasOrder={Constants.ORDER_TYPE.Load}
                                missingUnload={loadsWithoutUnloads.includes(cargo)}
                                handleCancelLoadShip={props.handleCancelLoadShip}
                                handleCancelUnloadShip={props.handleCancelUnloadShip}
                                handleUnloadShip={props.handleUnloadShip} />);
    }

    return (
      <Accordion>
         <AccordionSummary expandIcon={<ExpandMoreIcon />}
               aria-controls="panel1a-content"
               id="panel1a-header"
         >
            <Typography component="span">{carrier.name} {loadedTonnage}/{carrier.racks} racks used</Typography>
            {overloadedIcon}
         </AccordionSummary>

         <AccordionDetails>
                  <Stack spacing={0}>
                    {cargoItems}
                    <LoadNewShip carrier={carrier} availableShips={carrierData.loadableShips} handleLoadShip={props.handleLoadShip} />
                  </Stack>
         </AccordionDetails>
       </Accordion>
    );
}
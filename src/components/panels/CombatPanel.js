import {useState, useContext} from 'react';
import { List, ListItemIcon, ListItemText, Checkbox, ListItemButton } from '@mui/material';
import Attacker from './Attacker';
import {OrdersContext} from './OrdersContext';

function createAttackerMap(empireShipsInSector, fireOrders, hasLoadOrder, hasUnloadOrder) {
   const attackerMap = new Map();
   if (!empireShipsInSector) {
       return attackerMap;
   }

//   console.log("ships in sector = " + JSON.stringify(shipsInSector[empireName]));
//   console.log("ships in sector = " + JSON.stringify(Object.values(shipsInSector[empireName])));
   const attackers = Object.values(empireShipsInSector).filter(ship => ship.opGuns > 0);
   console.log("attackers " + JSON.stringify(attackers));
   if (!attackers) {
       return attackerMap();
   }

   // filter loaded attackers that are (a) not missiles and (b) have no unload order
   // filter unloaded attackers that are (a) not missiles or (b) have no load order
   for (const i in attackers) {
        const attacker = attackers[i];
        if (attacker.shipClass === 'missile') {
           if (!attacker.carrier && !hasLoadOrder(attacker)) {
               continue;
           }
        }
        else if (attacker.carrier && !hasUnloadOrder(attacker)) {
           continue;
        }
        const data = fireOrders[attacker] || [];
        attackerMap.set(attacker, data);
   }
   return attackerMap;
}

export default function CombatPanel(props) {
    const sectorData = props.sectorData;
    const turnData = props.turnData;
    const attackers = [];
    let attackerMap = new Map();
    const [checkedItems] = useState({});

   const { fireOrders, hasLoadOrder, hasUnloadOrder } = useContext(OrdersContext);

    if (sectorData && sectorData.ships) {
        const empireInSector = sectorData.ships[turnData.name];
        if (empireInSector) {
            const empireShipsInSector = empireInSector.ships;
            attackerMap = createAttackerMap(empireShipsInSector, fireOrders, hasLoadOrder, hasUnloadOrder);
        }
    }

    let sortedAttackers = Array.from(attackerMap.keys());
    sortedAttackers.sort((a, b) => {
       if (a.name < b.name) {
          return -1;
       }
       if (a.name > b.name) {
          return 1;
       }
       return 0;
    });


    function handleFireShip(attacker, targets, ascending) {
//      console.log("toggled = " + checked + ", " + attacker.name);
    }

    sortedAttackers.forEach((attacker) => {
       let attackerData = attackerMap.get(attacker);
       attackers.push(<Attacker key={attacker.name} attacker={attacker} attackerData={attackerData}
                                handleFireShip={handleFireShip}
                      />);
      });

    return (
    <>
      <List dense={true} sx={{ width: '100%', bgcolor: 'background.paper' }}>
       <ListItemButton role={undefined} onClick={props.handleClick} dense>
          <ListItemIcon>
                <Checkbox
                  edge="start"
                  checked={Object.values(checkedItems).every((isChecked) => isChecked)}
                  tabIndex={-1}
                />
              </ListItemIcon>
              <ListItemText id={-1} primary="All" />
          </ListItemButton>
         {attackers}
      </List>
    </>
    );
}
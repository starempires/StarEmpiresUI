import React from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';

export default function Attacker(props) {
    const attacker = props.attacker;
    const targets = null;
    const ascending = false;

    return (
          <ListItemButton role={undefined} onClick={(event) => props.handleFireShip(attacker, targets, ascending)} key={attacker.name} dense>
             <ListItemIcon>
               <Checkbox
                 edge="start"
                 checked={false}
                 inputProps={{ 'aria-labelledby': attacker.name }}
               />
             </ListItemIcon>
             <ListItemText id={attacker.name} primary={attacker.name} />
          </ListItemButton>
    );
}
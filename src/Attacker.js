import React from 'react';
import * as Constants from './Constants';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CommentIcon from '@mui/icons-material/Comment';
import IconButton from '@mui/material/IconButton';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';

export default function Attacker(props) {
    const attacker = props.attacker;
    const attackerData = props.attackerData;
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
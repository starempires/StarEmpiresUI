import {useState} from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Slide from '@mui/material/Slide';

export default function LoadNewShip(props) {
//    console.log("avail ships = " + JSON.stringify(props.availableShips));
//    console.log("load new ships for carrier " + JSON.stringify(props.carrier));
//    console.log("available ships " + JSON.stringify(props.availableShips));
//    const loadableShips = props.availableShips ? props.availableShips.map(cargo => cargo.name +
//        " (" + cargo.tonnage + " rack" + (cargo.tonnage > 1 ? "s" : "") + ")") : [];
//    console.log("loadable =" + JSON.stringify(loadableShips));
//    var inputText = "No loadable ships";
    var disabled = true;

    const [anchor, setAnchor] = useState(null);

    const openMenu = (event) => {
        setAnchor(event.currentTarget);
    };
    const closeMenu = () => {
        setAnchor(null);
    };
    const onMenuItemClick = (event, cargo) => {
        setAnchor(null);
        props.handleLoadShip(cargo, props.carrier);
    };

    var menuItems = [];
    var buttonText = "No loadable ships";
    if (props.availableShips.length > 0) {
//        inputText = "Select ship to load";
         buttonText = "Load ship";
        disabled = false;
        for (var i =0; i < props.availableShips.length; i++) {
             const cargo = props.availableShips[i];
             const text = cargo.name + " (" + cargo.tonnage + " rack" + (cargo.tonnage > 1 ? "s" : "") + ")";
//             console.log("text = " + text);
             menuItems.push(<MenuItem key={cargo.name} onClick={(event) => onMenuItemClick(event, cargo)}>{text}</MenuItem>);
        }
    }

    return (

       <Box>
       <Button
        id="basic-button"
        onClick={openMenu}
        color="primary"
        variant="contained"
        aria-haspopup="true"
        disabled={disabled}
      >
        {buttonText}
       </Button>
          {!disabled && <Menu
            id="basic-menu"
            open={Boolean(anchor)}
            anchorEl={anchor}
            onClose={closeMenu}
            TransitionComponent={Slide}
            MenuListProps={{
               'aria-labelledby': 'basic-button',
            }}
          >
            {menuItems}
          </Menu>}
      </Box>
    );
}

//      <Autocomplete
//             disabled={disabled}
//             id="load-combo-box"
//             options={loadableShips}
//             inputValue=""
//             noOptionsText="No loadable ships"
//             onChange={(event: any, newValue: string | null) => {
//                 const cargo = props.availableShips.filter(ship => ship.name == newValue);
//                 props.handleLoadShip(cargo, props.carrier);
//             }}
//             size="small"
//             sx={{ width: 300 }}
//             renderInput={(params) => <TextField disabled={true} {...params} label={inputText} />}
//           />
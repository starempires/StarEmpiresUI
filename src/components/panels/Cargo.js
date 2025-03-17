import * as Constants from './Constants';
import Typography from '@mui/material/Typography';
import CancelIcon from '@mui/icons-material/Cancel';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import UndoIcon from '@mui/icons-material/Undo';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

export default function Cargo(props) {
    var actionIcon = null;
    var undoIcon = null;
    var warningIcon = null;

    switch (props.hasOrder) {
        case Constants.ORDER_TYPE.Load:
             actionIcon = <Tooltip title="Pending load order"><UploadIcon size="small" /></Tooltip>
             undoIcon = <Tooltip title="Cancel load order"><UndoIcon size="small"  onClick={(event) => { props.handleCancelLoadShip(props.cargo, props.carrier); }}  /></Tooltip>
             warningIcon = props.missingUnload ?
                   <Tooltip title="Missing unload order"><WarningAmberIcon size="small"/></Tooltip> :
                   null;
             break;
        case Constants.ORDER_TYPE.Unload:
             actionIcon = <Tooltip title="Pending unload order"><DownloadIcon size="small" /></Tooltip>
             undoIcon = <Tooltip title="Cancel unload order"><UndoIcon size="small" onClick={(event) => { props.handleCancelUnloadShip(props.cargo, props.carrier); }} /></Tooltip>
             break;
        default:
             actionIcon = <Tooltip title="Unload"><CancelIcon size="small" onClick={(event) => { props.handleUnloadShip(props.cargo, props.carrier); }} /></Tooltip>;
             break;
    }
    const racks = "(" + props.cargo.tonnage + " rack" + (props.cargo.tonnage > 1 ? "s" : "") + ")";

    return (
         <Box
              sx={{ height: 15,
                    width: 350,
                    border: 1,
                    alignItems: 'start',
                    p: 2,
                    '&:hover': {
                       backgroundColor: 'lightgrey',
                       opacity: [0.9, 0.8, 0.7],
                     },
                  }}
         >
           <Stack sx={{alignItems: 'center'}} direction="row" spacing={2}>
               <Typography component="span">{props.cargo.name} {racks}</Typography>
               {actionIcon}
               {undoIcon}
               {warningIcon}
           </Stack>
         </Box>
    );
}
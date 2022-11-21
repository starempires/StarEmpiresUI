import React from 'react';
import * as Constants from './Constants';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

function createCargoRow(name: string, shipClass: string, tonnage: number) {
    return {name, shipClass, tonnage};
}

export default function LogisticsPanel(props) {
    if (props.sectorData) {
    }

    return (
         <Table sx={{}} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Ship</TableCell>
                <TableCell>Racks</TableCell>
                <TableCell>Cargo</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Tonnage</TableCell>
              </TableRow>
            </TableHead>
         </Table>
    );
}


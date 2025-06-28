import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { loadSnapshot } from '../components/common/SessionAPI';

interface ShipClass {
  name: string;
  hullType: string;
  guns: number;
  engines: number;
  scan: number;
  dp: number;
  racks: number;
  ar: number;
  tonnage: number;
  cost: number;
}

interface ShipClassesPageParams {
  sessionName: string;
  empireName: string;
  turnNumber: string;
  [key: string]: string | undefined;
}
export default function ShipClassesPage() {
    const {sessionName, empireName, turnNumber} = useParams<ShipClassesPageParams>();
    const [shipClasses, setShipClasses] = useState<ShipClass[] | null>(null);
    const [loading, setLoading] = useState(true);
    // Sorting state and sorted data
    const [sortBy, setSortBy] = useState<keyof ShipClass>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    useEffect(() => {
          async function loadShipClasses() {
             try {
                const snapshot:any = await loadSnapshot(sessionName!, empireName!, Number(turnNumber!));
                setShipClasses(snapshot.shipClasses);
//                 console.log("set snapshot to " + JSON.stringify(snapshot.shipClasses));
             } catch (error) {
                console.error("Error loading snapshot:", error);
             } finally {
                setLoading(false);
             }
          }
          loadShipClasses();
        }, [sessionName, empireName, turnNumber]);


    const sortedShipClasses = useMemo(() => {
      if (!shipClasses) {
          return [];
      }
      const numericColumns: (keyof ShipClass)[] = ['guns', 'engines', 'scan', 'dp', 'racks', 'ar', 'tonnage', 'cost'];
      return [...shipClasses].sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];
        if (numericColumns.includes(sortBy)) {
          const numA = Number(aVal ?? 0);
          const numB = Number(bVal ?? 0);
          return sortDirection === 'asc'
            ? numA - numB
            : numB - numA;
        } else {
          return sortDirection === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal));
        }
      });
    }, [shipClasses, sortBy, sortDirection]);

    const handleSort = (column: keyof ShipClass) => {
      if (sortBy === column) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortBy(column);
        setSortDirection('asc');
      }
    };

    if (loading) {
        return <Typography variant="h6" sx={{ ml: 5 }}>Loading...</Typography>;
    }

    // Ensure snapshot is available before rendering
    if (!shipClasses) {
        return <Typography variant="h6" sx={{ ml: 5, color: "red" }}>Error loading ship classes.</Typography>;
    }

  return (
    <div style={{ padding: 16 }}>
    <Typography variant="h5" gutterBottom>
        Known ship classes for {empireName}, session {sessionName}, turn {turnNumber}
    </Typography>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sortDirection={sortBy === 'name' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'name'}
                direction={sortBy === 'name' ? sortDirection : 'asc'}
                onClick={() => handleSort('name')}
              >
                Name
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'hullType' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'hullType'}
                direction={sortBy === 'hullType' ? sortDirection : 'asc'}
                onClick={() => handleSort('hullType')}
              >
                Hull Type
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'guns' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'guns'}
                direction={sortBy === 'guns' ? sortDirection : 'asc'}
                onClick={() => handleSort('guns')}
              >
                Guns
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'engines' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'engines'}
                direction={sortBy === 'engines' ? sortDirection : 'asc'}
                onClick={() => handleSort('engines')}
              >
                Engines
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'scan' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'scan'}
                direction={sortBy === 'scan' ? sortDirection : 'asc'}
                onClick={() => handleSort('scan')}
              >
                Scan
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'dp' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'dp'}
                direction={sortBy === 'dp' ? sortDirection : 'asc'}
                onClick={() => handleSort('dp')}
              >
                DP
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'racks' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'racks'}
                direction={sortBy === 'racks' ? sortDirection : 'asc'}
                onClick={() => handleSort('racks')}
              >
                Racks
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'ar' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'ar'}
                direction={sortBy === 'ar' ? sortDirection : 'asc'}
                onClick={() => handleSort('ar')}
              >
                AR
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'tonnage' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'tonnage'}
                direction={sortBy === 'tonnage' ? sortDirection : 'asc'}
                onClick={() => handleSort('tonnage')}
              >
                Tonnage
              </TableSortLabel>
            </TableCell>
            <TableCell sortDirection={sortBy === 'cost' ? sortDirection : false} sx={{ fontWeight: 'bold' }}>
              <TableSortLabel
                active={sortBy === 'cost'}
                direction={sortBy === 'cost' ? sortDirection : 'asc'}
                onClick={() => handleSort('cost')}
              >
                Cost
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedShipClasses.map((shipClass, index) => (
            <TableRow key={index}>
              <TableCell>{shipClass.name ?? 0}</TableCell>
              <TableCell>{shipClass.hullType ?? 0}</TableCell>
              <TableCell>{shipClass.guns ?? 0}</TableCell>
              <TableCell>{shipClass.engines ?? 0}</TableCell>
              <TableCell>{shipClass.scan ?? 0}</TableCell>
              <TableCell>{shipClass.dp ?? 0}</TableCell>
              <TableCell>{shipClass.racks ?? 0}</TableCell>
              <TableCell>{shipClass.ar ?? 0}</TableCell>
              <TableCell>{shipClass.tonnage ?? 0}</TableCell>
              <TableCell>{shipClass.cost ?? 0}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    </div>
  );
}
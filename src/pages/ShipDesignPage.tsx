import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Box,
} from '@mui/material';
import { HullParameters, Hulls } from '../components/common/HullParameters';

const ZERO_COMPONENTS = {
      guns: 0,
        engines: 0,
        scan: 0,
        dp: 0,
        racks: 0,
    };

const MAX_LENGTH = 25;

export default function ShipDesignPage() {
  const [hullParameters, setHullParameters] = useState<HullParameters | null>(null);
  const [className, setClassName] = useState('');
  const [cost, setCost] = useState(0);
  const [tonnage, setTonnage] = useState(0);
  const [components, setComponents] = useState(ZERO_COMPONENTS);
  const [designText, setDesignText] = useState('');

  const handleComponentChange = (key: keyof typeof components, value: number) => {
    setComponents(prev => ({ ...prev, [key]: value }));
// console.log("Key " + key + ", value = " + value);
  };

 useEffect(() => {
      if (!hullParameters) {
          return;
      }
      if (!className) {
          return;
      }
      setDesignText(["DESIGN", hullParameters.hullType.replaceAll(' ', '_'), className, components.guns, components.engines, components.scan, components.dp, components.racks].join(' '));
  }, [className, hullParameters, components]);

  const computeComponent = (delta: number, denominator: number) => {
      if (delta === 0) return 0;

     // Compute exponential impact
     const impact = Math.exp(Math.abs(delta) / denominator);

     // Positive delta increases cost, negative delta decreases cost
     return delta > 0 ? Math.round(impact) : -Math.round(impact);
   };

  useEffect(() => {
    if (hullParameters) {
        const addGuns = components.guns - hullParameters.baseGuns;
        const addEngines = components.engines - hullParameters.baseEngines;
        const addScan = components.scan - hullParameters.baseScan;
        const addDp = components.dp - hullParameters.baseDp;
        const addRacks = components.racks - hullParameters.baseRacks;
//         console.log("addGuns = " + addGuns + ", addEngines = " + addEngines + ", addScan = " + addScan + ", addDp = " + addDp + ", addRacks = " + addRacks);
      const additionalCost =
                   computeComponent(addGuns, hullParameters.costGuns) +
                   computeComponent(addEngines, hullParameters.costEngines) +
                   computeComponent(addScan, hullParameters.costScan) +
                   computeComponent(addDp, hullParameters.costDp) +
                   computeComponent(addRacks, hullParameters.costRacks);
      const additionalTonnage =
                   computeComponent(addGuns, hullParameters.tonnageGuns) +
                   computeComponent(addEngines, hullParameters.tonnageEngines) +
                   computeComponent(addScan, hullParameters.tonnageScan) +
                   computeComponent(addDp, hullParameters.tonnageDp) +
                   computeComponent(addRacks, hullParameters.tonnageRacks);
      const cost = Math.max(1, hullParameters.baseCost + additionalCost);
      const tonnage = Math.max(1, hullParameters.baseTonnage + additionalTonnage);
      setCost(cost);
      setTonnage(tonnage);
    }
    else {
      setCost(0);
      setTonnage(0);
    }
  }, [components, hullParameters]);

  const handeHullChange = (hullType: string) => {

      if (!hullType) {
          setHullParameters(null);
          setComponents(ZERO_COMPONENTS);
          return;
        }
      const hullParameters = Hulls[hullType];
      if (!hullParameters) {
          setHullParameters(null);
          setComponents(ZERO_COMPONENTS);
          return;
      }
//       console.log("key = " + hullType + ", value = " + JSON.stringify(hullParameters));
      setHullParameters(hullParameters);
      setComponents({
          guns: hullParameters.baseGuns,
          engines: hullParameters.baseEngines,
          scan: hullParameters.baseScan,
          dp: hullParameters.baseDp,
          racks: hullParameters.baseRacks,
        });
  };

   const handleClassNameChange = (value: string) => {
    setClassName(value)
  }
  const selectableHullTypes = Object.keys(Hulls).filter(
    (hullType) => hullType !== 'missile' && hullType !== 'device'
  );

  return (
    <Container maxWidth="sm">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          Ship Design
        </Typography>
        <Paper elevation={3} sx={{ padding: 2, borderRadius: 2 }}>
          <TextField
            fullWidth
            label="Ship Class Name"
            value={className}
            onChange={(e) => handleClassNameChange(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            margin="normal"
            helperText={`Only letters and numbers are allowed, max length ${MAX_LENGTH} characters`}
            inputProps={{
              pattern: '^[a-zA-Z0-9]+$',
              maxLength: MAX_LENGTH,
            }}
          />
          <TextField
            fullWidth
            select
            label="Hull Type"
            value={hullParameters ? hullParameters.hullType : ''}
            onChange={(e) => handeHullChange(e.target.value)}
            margin="normal"
          >
            <MenuItem value="" disabled>
              Select a Hull Type
            </MenuItem>
            {selectableHullTypes.map(hullType => (
              <MenuItem key={hullType} value={hullType}>
                {hullType}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2} mt={1}>
            {(['guns', 'engines', 'scan', 'dp', 'racks'] as const).map(comp => {
               let maxValue = Infinity;
               let name = comp.charAt(0).toUpperCase() + comp.slice(1);
               let disabled = true;
               if (hullParameters) {
                   const maxKey = `max${name}` as keyof typeof hullParameters;
                   maxValue = Number(hullParameters[maxKey]);
                   disabled = maxValue === 0;
               }
              const value = components[comp];
             return ( <Grid item xs={6} key={comp}>
                <TextField
                  fullWidth
                  type="number"
                  label={name}
                  value={components[comp]}
                  helperText={ maxValue === 0 ? `No ${name} allowed` : (maxValue === Infinity ? '' : `Max value ${maxValue}`)}
                  onChange={(e) => handleComponentChange(comp, Number(e.target.value))}
                  error={value < 0 || value > maxValue}
                  disabled={disabled}
                  color={value == maxValue ? 'info' : 'success'}
                  focused
                  inputProps={{
                    min: 0,
                    max: maxValue,
                  }}
                />
              </Grid>);
            })}
          </Grid>

          <Box mt={3}>
            <Typography>Cost: {cost}</Typography>
            <Typography>Tonnage: {tonnage}</Typography>
            <Typography>{designText}</Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};
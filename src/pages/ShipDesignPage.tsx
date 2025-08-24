import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Box,
  Button,
} from '@mui/material';
import { HullParameters, Hulls } from '../components/common/HullParameters';

interface ShipComponents {
  guns: number;
  dp: number;
  engines: number;
  scan: number;
  racks: number;
}

interface MissileComponents {
  guns: number;
  tonnage: number;
}

const INIT_SHIP_COMPONENTS = {
      guns: 0,
      dp: 0,
      engines: 0,
      scan: 0,
      racks: 0,
    };

const INIT_MISSILE_COMPONENTS = {
      guns: 1,
      tonnage: 1,
    };

const MAX_LENGTH = 25;
const MISSILE_DESIGN_FACTOR = 5;

export default function ShipDesignPage() {
  const [hullParameters, setHullParameters] = useState<HullParameters | null>(null);
  const [className, setClassName] = useState('MyShipClass');
  const [shipCost, setShipCost] = useState(1);
  const [shipTonnage, setShipTonnage] = useState(1);
  const [missileCost, setMissileCost] = useState(1);
  const [shipComponents, setShipComponents] = useState<ShipComponents>(INIT_SHIP_COMPONENTS);
  const [missileComponents, setMissileComponents] = useState<MissileComponents>(INIT_MISSILE_COMPONENTS);
  const [designText, setDesignText] = useState('');

  const handleShipComponentChange = (key: keyof ShipComponents, value: number) => {
    setShipComponents(prev => ({ ...prev, [key]: value }));
  };

  const handleMissileComponentChange = (key: keyof MissileComponents, value: number) => {
    setMissileComponents(prev => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
      if (hullParameters) {
          setComponentBaseValues(hullParameters);
      }
  };

 useEffect(() => {
      if (!hullParameters) {
          return;
      }
      if (!className) {
          return;
      }
      if (hullParameters.hullType === 'missile') {
          setDesignText(["DESIGN",
              "<world>",
              className,
              hullParameters.hullType.replaceAll(' ', '_'),
              missileComponents.guns,
              missileComponents.tonnage].join(' '));
      }
      else {
          setDesignText(["DESIGN",
              "<world>",
              className,
              hullParameters.hullType.replaceAll(' ', '_'),
              shipComponents.guns,
              shipComponents.dp,
              shipComponents.engines,
              shipComponents.scan,
              shipComponents.racks].join(' '));
      }
  }, [className, hullParameters, shipComponents, missileComponents]);

  const computeComponent = (delta: number, denominator: number) => {
      if (delta === 0 || denominator === 0) {
          return 0;
      }

     // Compute exponential impact
     const impact = Math.exp(Math.abs(delta) / denominator);
     console.log("delta = " + delta + ", denominator = " + denominator + ", impact = " + impact);

     // Positive delta increases cost, negative delta decreases cost
     return delta > 0 ? Math.round(impact) : -Math.round(impact);
   };

  useEffect(() => {
    if (hullParameters) {
        const addGuns = shipComponents.guns - hullParameters.baseGuns;
        const addDp = shipComponents.dp - hullParameters.baseDp;
        const addEngines = shipComponents.engines - hullParameters.baseEngines;
        const addScan = shipComponents.scan - hullParameters.baseScan;
        const addRacks = shipComponents.racks - hullParameters.baseRacks;
//         console.log("addGuns = " + addGuns + ", addEngines = " + addEngines + ", addScan = " + addScan + ", addDp = " + addDp + ", addRacks = " + addRacks);
      const additionalCost =
                   computeComponent(addGuns, hullParameters.costGuns) +
                   computeComponent(addDp, hullParameters.costDp) +
                   computeComponent(addEngines, hullParameters.costEngines) +
                   computeComponent(addScan, hullParameters.costScan) +
                   computeComponent(addRacks, hullParameters.costRacks);
      const additionalTonnage =
                   computeComponent(addGuns, hullParameters.tonnageGuns) +
                   computeComponent(addDp, hullParameters.tonnageDp) +
                   computeComponent(addEngines, hullParameters.tonnageEngines) +
                   computeComponent(addScan, hullParameters.tonnageScan) +
                   computeComponent(addRacks, hullParameters.tonnageRacks);
      const cost = Math.max(1, hullParameters.baseCost + additionalCost);
      const tonnage = Math.max(1, hullParameters.baseTonnage + additionalTonnage);
      setShipCost(cost);
      setShipTonnage(tonnage);
    }
    else {
      setShipCost(0);
      setShipTonnage(0);
    }
  }, [shipComponents, hullParameters]);

  useEffect(() => {
    if (hullParameters === Hulls["missile"]) {
        const cost = Math.max(1, Math.round(Math.exp(missileComponents.guns / (MISSILE_DESIGN_FACTOR * missileComponents.tonnage))));
       setMissileCost(cost);
    }
    else {
       setMissileCost(0);
    }
  }, [missileComponents]);

const setComponentBaseValues = (parameters: HullParameters) => {
     if (parameters.hullType === "missile") {
         setMissileComponents({
             guns: parameters.baseGuns,
             tonnage: parameters.baseTonnage,
         });
     }
     else {
         setShipComponents({
             guns: parameters.baseGuns,
             dp: parameters.baseDp,
             engines: parameters.baseEngines,
             scan: parameters.baseScan,
             racks: parameters.baseRacks,
         });
     }
  };

  const handeHullChange = (hullType: string) => {

      if (!hullType) {
          setHullParameters(null);
          setShipComponents(INIT_SHIP_COMPONENTS);
          setMissileComponents(INIT_MISSILE_COMPONENTS);
          return;
        }
      const hullParameters = Hulls[hullType];
//       console.log("key = " + hullType + ", value = " + JSON.stringify(hullParameters));
      setHullParameters(hullParameters);
      setComponentBaseValues(hullParameters);
//       if (hullType === "missile") {
//           setMissileComponents({
//               guns: hullParameters.baseGuns,
//               tonnage: hullParameters.baseTonnage,
//               });
//       }
//       else {
//           setShipComponents({
//               guns: hullParameters.baseGuns,
//               dp: hullParameters.baseDp,
//               engines: hullParameters.baseEngines,
//               scan: hullParameters.baseScan,
//               racks: hullParameters.baseRacks,
//         });
//       }
  };

   const handleClassNameChange = (value: string) => {
    setClassName(value)
  }
  const selectableHullTypes = Object.keys(Hulls)
    .filter((hullType) => hullType !== 'device')
    .sort((a, b) => a.localeCompare(b));

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
            onChange={(e) => handleClassNameChange(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            margin="normal"
            helperText={`Only letters and numbers are allowed, max length ${MAX_LENGTH} characters`}
            inputProps={{
              pattern: '^[a-zA-Z0-9_]+$',
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
          {hullParameters?.hullType === 'missile' ? (
            <Grid container spacing={2} mt={1}>
              <Grid>
                <TextField
                  fullWidth
                  type="number"
                  label="Guns"
                  value={missileComponents.guns}
                  onChange={(e) => handleMissileComponentChange('guns', Number(e.target.value))}
                  error={missileComponents.guns < 1}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid>
                <TextField
                  fullWidth
                  type="number"
                  label="Tonnage"
                  value={missileComponents.tonnage}
                  onChange={(e) => handleMissileComponentChange('tonnage', Number(e.target.value))}
                  error={missileComponents.tonnage < 1}
                  inputProps={{ min: 1 }}
                />
              </Grid>
              <Grid>
                <Box mt={3}>
                  <Typography>Cost: {missileCost}</Typography>
                  <Typography>{designText}</Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Grid container spacing={2} mt={1}>
              {(['guns', 'dp', 'engines', 'scan', 'racks'] as const).map((comp) => {
                let maxValue = Infinity;
                let name = comp.charAt(0).toUpperCase() + comp.slice(1);
                let disabled = true;
                if (hullParameters) {
                  const maxKey = `max${name}` as keyof typeof hullParameters;
                  maxValue = Number(hullParameters[maxKey]);
                  disabled = maxValue === 0;
                }
                const value = shipComponents[comp];
                return (
                  <Grid key={comp}>
                    <TextField
                      fullWidth
                      type="number"
                      label={name}
                      value={shipComponents[comp]}
                      helperText={
                        maxValue === 0
                          ? `No ${name} allowed`
                          : maxValue === Infinity
                          ? ''
                          : value === maxValue
                            ? <span style={{ color: 'red' }}>{`Max value ${maxValue}`}</span>
                            : `Max value ${maxValue}`
                      }
                      onChange={(e) => handleShipComponentChange(comp, Number(e.target.value))}
                      error={value < 0 || value > maxValue}
                      disabled={disabled}
                      color={value === maxValue ? 'info' : 'success'}
                      focused
                      inputProps={{
                        min: 0,
                        max: maxValue,
                      }}
                    />
                  </Grid>
                );
              })}
              <Box sx={{ my: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleReset}
                  disabled={!hullParameters}
                >
                  Reset Values
                </Button>
              </Box>

              <Grid>
                <Box mt={3}>
                  <Typography>Cost: {shipCost}</Typography>
                  <Typography>Tonnage: {shipTonnage}</Typography>
                  <br/>
                  <Typography>Use the text below to submit a design order for this ship class.</Typography>
                  <Typography>{designText}</Typography>
                </Box>
              </Grid>
            </Grid>
          )}

        </Paper>
      </Box>
    </Container>
  );
};
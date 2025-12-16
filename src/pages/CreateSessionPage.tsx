import React, { useMemo, useState } from 'react';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ProcessingDialog from '../components/common/ProcessingDialog';
import AlphanumericTextField from '../components/common/AlphanumericTextField';
import { useNavigate } from 'react-router-dom';
import { createSession } from '../components/common/SessionAPI';
import { checkSessionExists, registerEmpire, registerSession } from '../components/common/ClientFunctions';

import '../index.css';

interface GMControlsPageProps {
  userAttributes: any;
  userGroups: any;
}



// Centralized session property definitions
interface SessionPropertyDef {
  key: string;
  name: string;
  min: number;
  max: number;
  defaultValue: number;
}

const SESSION_PROPERTIES: Record<string, SessionPropertyDef> = {
  radius: { key: 'radius', name: 'Galaxy Radius', min: 2, max: 10, defaultValue: 5 },
  maxStormIntensity: { key: 'maxStormIntensity', name: 'Max Storm Intensity', min: 0, max: 10, defaultValue: 5 },
  numWormnets: { key: 'numWormnets', name: 'Number of Wormnets', min: 0, max: 3, defaultValue: 1 },
  maxWormnetPortals: { key: 'maxWormnetPortals', name: 'Max Wormnet Portals', min: 2, max: 5, defaultValue: 3 },
  worldDensity: { key: 'worldDensity', name: 'World Density', min: 1, max: 10, defaultValue: 5 },
  stormDensity: { key: 'stormDensity', name: 'Storm Density', min: 1, max: 10, defaultValue: 5 },
  nebulaDensity: { key: 'nebulaDensity', name: 'Nebula Density', min: 1, max: 10, defaultValue: 5 },
};

const SESSION_PROPERTIES_LIST: SessionPropertyDef[] = Object.values(SESSION_PROPERTIES);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// const makeRange = (min: number, max: number) =>
//   Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i);

export default function CreateSessionPage({ userAttributes, userGroups }: GMControlsPageProps) {
  const [sessionName, setSessionName] = useState('');
  const [numPlayers, setNumPlayers] = useState<number>(6);
  const [processing, setProcessing] = useState<boolean>(false);
  const [configValues, setConfigValues] = useState<Record<string, number>>(
    () => Object.fromEntries(SESSION_PROPERTIES_LIST.map(def => [def.key, def.defaultValue]))
  );
  const navigate = useNavigate();

  const canSubmit = useMemo(() => {
      return sessionName.trim();
  }, [sessionName]);

  const handleSubmit = async () => {
   setProcessing(true);

   try {
      const exists = await checkSessionExists(sessionName);
      if (exists) {
          console.log(`Session "${sessionName}" already exists.`);
          return;
      }

      const sessionResult = await registerSession(sessionName, numPlayers, userAttributes.preferred_username);
      if (sessionResult && Array.isArray((sessionResult as any).errors) && (sessionResult as any).errors.length > 0) {
          console.error('Session create errors:', (sessionResult as any).errors);
          const message = (sessionResult as any).errors
            .map((e: any) => e?.message || JSON.stringify(e))
            .join('; ');
          throw new Error(message || 'Unknown error creating session');
      }

      const overrideProperties: Record<string, string> =
        Object.fromEntries(Object.entries(configValues).map(([k, v]) => [k, String(v)]));
//     console.log('createSession payload (UI):', JSON.stringify({ sessionName, empireData, overrideProperties }));
      const createResult = await createSession(sessionName, overrideProperties);
//     console.log("createSession result " + JSON.stringify(createResult));

   try {
      const parsedResult = JSON.parse(createResult);
      if (!parsedResult || parsedResult.data !== "OK") {
        const msg = parsedResult?.message || "(no message)";
        throw new Error("Error creating session: " + msg);
      }
   } catch {
      throw new Error("createSession returned non-JSON response: " + createResult);
   }
   console.log('Session created:', sessionResult);

    await registerEmpire(sessionName, userAttributes.preferred_username, "GM", "GM");
    navigate('/');
  } catch (err) {
    console.error('Failed to create session/empires', err);
  } finally {
    setProcessing(false);
  }
};

  if (!userGroups?.includes("GAMEMASTERS")) {
    return (
      <Box className="p-6">
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Unauthorized
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You must be a member of the <strong>GAMEMASTERS</strong> group to access this page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <React.Fragment>
     <ProcessingDialog open={processing} message="Creating Session..." />
     <Box className="p-6">
      <Typography variant="h6" gutterBottom>
        Welcome, {userAttributes?.preferred_username}.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:'auto'}}>
            <AlphanumericTextField
              required
              label="Session Name"
              value={sessionName}
              onChange={setSessionName}
              size="small"
              margin="dense"
              sx={{ width: 280 }}
              maxLength={50}
            />
          </Grid>
          <Grid size={{xs:'auto'}}>
            <FormControl required sx={{ width: 160, ml: 2 }} size="small">
              <InputLabel id="num-players-label">Number of Players</InputLabel>
              <Select
                labelId="num-players-label"
                label="Number of Players"
                value={numPlayers}
                onChange={(e) => setNumPlayers(Number(e.target.value))}
                size="small"
              >
                {Array.from({ length: 7 }, (_, i) => i + 2).map(n => (
                  <MenuItem key={n} value={n}>{n}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>


        {/* Session Configuration */}
        <Divider sx={{ my: 3 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>Session Parameters</Typography>

        <Grid container spacing={2}>
          {SESSION_PROPERTIES_LIST.map((def) => (
            <Grid key={def.key} size={{ xs: 12, sm: 6, md: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={def.name}
                  value={configValues[def.key]}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    if (Number.isNaN(next)) {
                      setConfigValues(prev => ({ ...prev, [def.key]: def.min }));
                    } else {
                      setConfigValues(prev => ({ ...prev, [def.key]: clamp(next, def.min, def.max) }));
                    }
                  }}
                  inputProps={{ min: def.min, max: def.max, step: 1 }}
                  helperText={`Min ${def.min}, Max ${def.max}`}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
           <Button variant="contained" disabled={!canSubmit || processing} onClick={handleSubmit}>
              Create Session
           </Button>
        </Box>
      </Paper>
     </Box>
    </React.Fragment>
  );
}
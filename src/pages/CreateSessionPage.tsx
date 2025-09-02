import { useEffect, useMemo, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
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

import '../index.css';

const client = generateClient<Schema>({ authMode: 'userPool' });

interface GMControlsPageProps {
  userAttributes: any;
  userGroups: any;
}

interface EmpireRow {
  empireName: string;
  homeworldName: string;
  starbaseName: string;
  playerName: string;
}

const toUnderscore = (s: string) => (s ?? '').replace(/\s+/g, '_');

export default function CreateSessionPage({ userAttributes, userGroups }: GMControlsPageProps) {
  const [sessionName, setSessionName] = useState('');
  const [numPlayers, setNumPlayers] = useState<number>(6);
  const [rows, setRows] = useState<EmpireRow[]>(() => Array.from({ length: 2 }, () => ({ empireName: '', homeworldName: '', starbaseName: '', playerName: '' })));

  // console.log("user groups = ", userGroups);

  // keep rows array length in sync with selected number of players
  useEffect(() => {
    setRows((prev) => {
      if (prev.length === numPlayers) return prev;
      if (prev.length < numPlayers) {
        return prev.concat(Array.from({ length: numPlayers - prev.length }, () => ({ empireName: '', homeworldName: '', starbaseName: '', playerName: '' })));
      }
      return prev.slice(0, numPlayers);
    });
  }, [numPlayers]);

  const abbrevs = useMemo(() => {
    const used = new Set<string>();
    const result: string[] = [];

    const lettersOnly = (s: string) => (s || '').replace(/[^A-Za-z]/g, '').toUpperCase();

    const normalizeName = (name: string): string => {
      // Replace underscores with spaces, trim, then drop leading "The" (case-insensitive)
      const base = (name || '').replace(/_/g, ' ').trim();
      return base.replace(/^\s*the\b[\s_-]*/i, '').trim();
    };

    const candidatesFromName = (name: string): string[] => {
      const cleaned = normalizeName(name);
      const letters = lettersOnly(cleaned);
      const cands: string[] = [];
      // primary: first two letters
      if (letters.length >= 2) cands.push(letters.slice(0, 2));
      // fallbacks: all ordered pairs i<j from the name
      for (let i = 0; i < letters.length; i++) {
        for (let j = i + 1; j < letters.length; j++) {
          const cand = letters[i] + letters[j];
          if (!cands.includes(cand)) cands.push(cand);
        }
      }
      // final fallbacks: first letter + A..Z
      const first = letters[0] ?? 'X';
      for (let k = 0; k < 26; k++) {
        const cand = first + String.fromCharCode(65 + k);
        if (!cands.includes(cand)) cands.push(cand);
      }
      // absolute fallback
      cands.push('XX');
      return cands;
    };

    for (const r of rows) {
      const cands = candidatesFromName(r.empireName);
      let chosen = 'XX';
      for (const c of cands) {
        if (!used.has(c)) {
          chosen = c;
          break;
        }
      }
      used.add(chosen);
      result.push(chosen);
    }
    return result;
  }, [rows]);

  const canSubmit = useMemo(() => {
    if (!sessionName.trim()) return false;
    return rows.every(r => r.empireName.trim() && r.homeworldName.trim() && r.starbaseName.trim() && r.playerName.trim());
  }, [sessionName, rows]);

  const handleRowChange = (index: number, field: keyof EmpireRow, value: string) => {
    setRows(prev => {
      const next = [...prev];
      const sanitized = field === 'playerName' ? value.replace(/\s+/g, '') : toUnderscore(value);
      next[index] = { ...next[index], [field]: sanitized } as EmpireRow;
      return next;
    });
  };

async function createEmpire(name: string, playerName: string, sessionName: string): Promise<any> {
    const result = await client.models.Empire.create({
              name: name,
              playerName: playerName,
              sessionName: sessionName,
              ordersLocked: false,
              empireType: 'ACTIVE',  // choose the enum that fits a new player empire
    });
    return result.data;
}
  async function createSession(name: string, numPlayers: number): Promise<any> {
     const result = await client.models.Session.create({
          name: name,
          currentTurnNumber: 0,
          status: 'CREATED',
          sessionType: 'STANDARD',
          numPlayers: numPlayers,
          updateHours: 168,
        });
     return result.data;
  }

const handleSubmit = async () => {
  try {
    // 1) Create the Session
    const sessionResult = await createSession(sessionName, numPlayers);

    // Optional: surface backend-reported errors (Amplify Gen2 returns { data, errors })
    if (sessionResult && Array.isArray((sessionResult as any).errors) && (sessionResult as any).errors.length > 0) {
      console.error('Session create errors:', (sessionResult as any).errors);
      const message = (sessionResult as any).errors
        .map((e: any) => e?.message || JSON.stringify(e))
        .join('; ');
      throw new Error(message || 'Unknown error creating session');
    }

    console.log('Session created:', sessionResult);

    // 2) Create one Empire per player row
    await Promise.all(
      rows.map(async (row) => {
        const empireResult = await createEmpire(row.empireName, row.playerName, sessionName);

        if (empireResult && Array.isArray((empireResult as any).errors) && (empireResult as any).errors.length > 0) {
          console.error('Empire create errors:', (empireResult as any).errors);
          const message = (empireResult as any).errors
            .map((e: any) => e?.message || JSON.stringify(e))
            .join('; ');
          throw new Error(message || 'Unknown error creating empire');
        }

        console.log('Empire created:', empireResult);
      })
    );

    // (Optional) Reset the form
    // setSessionName('');
    // setNumPlayers(2);
    // setRows(Array.from({ length: 2 }, () => ({ empireName: '', homeworldName: '', starbaseName: '', playerName: '' })));

  } catch (err) {
    console.error('Failed to create session/empires', err);
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
    <Box className="p-6">
      <Typography variant="h6" gutterBottom>
        Welcome, {userAttributes?.preferred_username}.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:'auto'}}>
            <TextField
              required
              label="Session Name"
              value={sessionName}
              onChange={(e) => setSessionName(toUnderscore(e.target.value))}
              size="small"
              margin="dense"
              sx={{ width: 280 }}
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

        <Divider sx={{ my: 3 }} />

        <Grid container spacing={1}>
          {rows.map((row, idx) => (
            <Grid key={idx} size={{xs:12}}>
              <Paper variant="outlined" sx={{ p: 1 }}>
                <Grid container spacing={1} alignItems="flex-start">
                  <Grid size={{xs:12, md:2}}>
                    <Typography variant="subtitle2" sx={{ lineHeight: 1, mb: 0 }}>Empire {idx + 1}</Typography>
                  </Grid>
                  <Grid size={{ xs: 12 }} />
                  <Grid size={{xs:12, md:2}}>
                    <TextField
                      fullWidth
                      required
                      label="Empire Name"
                      value={row.empireName}
                      onChange={(e) => handleRowChange(idx, 'empireName', e.target.value)}
                      size="small"
                      margin="dense"
                      sx={{ maxWidth: 200 }}
                    />
                    <Box sx={{ mt: 0 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Abbreviation: {abbrevs[idx]}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid size={{xs:12, md:2}}>
                    <TextField
                      fullWidth
                      required
                      label="Homeworld Name"
                      value={row.homeworldName}
                      onChange={(e) => handleRowChange(idx, 'homeworldName', e.target.value)}
                      size="small"
                      margin="dense"
                      sx={{ maxWidth: 200 }}
                    />
                  </Grid>
                  <Grid size={{xs:12, md:2}}>
                    <TextField
                      fullWidth
                      required
                      label="Starbase Name"
                      value={row.starbaseName}
                      onChange={(e) => handleRowChange(idx, 'starbaseName', e.target.value)}
                      size="small"
                      margin="dense"
                      sx={{ maxWidth: 200 }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <TextField
                      fullWidth
                      required
                      type="text"
                      label="Player Name"
                      value={row.playerName}
                      onChange={(e) => handleRowChange(idx, 'playerName', e.target.value)}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault(); }}
                      inputProps={{ pattern: "\\S*" }}
                      size="small"
                      margin="dense"
                      sx={{ maxWidth: 200 }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          ))}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
          <Button variant="contained" disabled={!canSubmit} onClick={handleSubmit}>
            Create Session
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Stage } from 'react-konva';
import Galaxy from '../components/galaxy/Galaxy';
import * as Constants from '../Constants';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type CustomKonvaEventObject<T extends Event> = {
  evt: T;
  // Add any additional properties if needed
};

export default function MapPage({ signOut, userAttributes }: { signOut: () => void; userAttributes: any }) {

  const { sessionName, empireName, turnNumber } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

    useEffect(() => {
      // Define an async function to call the API
      const fetchSessionObject = async () => {
        try {
          const response = await fetch("https://api.starempires.com/getSessionObject", {
            method: "POST",
            headers: {
              "Authorization": "Bearer REAL_JWT_TOKEN",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              sessionName: sessionName,
              empireName: empireName,
              turnNumber: turnNumber,
              sessionObject: "SNAPSHOT"
            })
          });
          const apiData = await response.json();
          setData(apiData);
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchSessionObject();
    }, []);

  const handleDoubleClick = (event: CustomKonvaEventObject<MouseEvent>) => {
    event.evt.preventDefault();
//     setIsOpen(!isOpen);
  };

  const handleClick = (event: CustomKonvaEventObject<MouseEvent>, sectorData: any) => {
    event.evt.preventDefault();
//     setSectorData(sectorData);
    console.log(
      "left click (button " + event.evt.button + ") = " +
      sectorData.oblique + ", " + sectorData.y
    );
  };

    if (loading) {
        return <Typography variant="h6" sx={{ ml: 5 }}>Loading...</Typography>;
    }

    // Ensure data is available before rendering
    if (!data) {
        return <Typography variant="h6" sx={{ ml: 5, color: "red" }}>Error loading data.</Typography>;
    }

   // width, height enough room for hover text
   // TODO: revisit this for a better computation
   const width = (data.radius * 8) * Constants.RADIUS;
   const height = (data.radius * 6) * Constants.RADIUS;

    return (
      <div>
        <Grid container spacing={2}>
          <Grid item xs={10}>
            <Typography variant="h6" gutterBottom sx={{ ml:5, color: data.colors["visible"] }}>
                  Welcome, {userAttributes?.preferred_username}
            <button onClick={signOut}>Sign out</button>
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ ml:5, color: data.colors["visible"] }}>
                  {data.name} galactic map for session {data.session}, turn {data.turnNumber}
            </Typography>
            <Box sx={{ ml: 5 }}>
              <Stage width={width} height={height}>
                <Galaxy turnData={data} onDblClick={handleDoubleClick} onClick={handleClick}/>
              </Stage>
            </Box>
            </Grid>
          </Grid>
      </div>
    );
}